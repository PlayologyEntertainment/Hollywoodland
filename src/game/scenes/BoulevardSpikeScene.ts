import Phaser from 'phaser';

import type { BoulevardActiveRule, BoulevardManifest, BoulevardPlane, BoulevardSign } from '../BoulevardManifest';
import { isBuildingActive, nearestInteractable } from '../BoulevardStates';
import { skyTileCount, skyTileLayout, SKY_DRIFT_PX_PER_SEC } from '../SkyDrift';
import {
  DEFAULT_WALK_CYCLE,
  distanceForFrame,
  footprintsForFrame,
  walkFrameAt,
  type WalkCycle,
} from '../WalkCycle';
import { getAssignmentById, resolveActiveAssignment, startAssignment } from '../../domain/Assignments';
import { ALL_ASSIGNMENTS } from '../../domain/AssignmentDefinitions';
import { enterCastingOffice, advanceTime, purchaseHousingUpgrade } from '../../domain/CareerActions';
import { createDefaultCareerState, DEFAULT_PLAYER_X, type CareerState } from '../../domain/CareerState';
import { applyDialogueChoiceById, type DialogueChoiceSelectedPayload } from '../../domain/Dialogue';
import { getDialogueGraphById } from '../../domain/DialogueGraphs';
import type {
  AssignmentStartRequestedPayload,
  AuditionSubmittedPayload,
  DomainEventBus,
  StatusPanelVisibilityChangedPayload,
} from '../../domain/DomainEventBus';
import { ALL_ITEMS } from '../../domain/InventoryDefinitions';
import { applyAuditionOutcome, resolveAudition } from '../../domain/Performance';
import { getAuditionById } from '../../domain/PerformanceDefinitions';
import { unlockTalent, type TalentUnlockRequestedPayload } from '../../domain/Progression';
import { ALL_QUESTS } from '../../domain/QuestDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS } from '../../domain/RelationshipDefinitions';
import { getTalentById } from '../../domain/TalentDefinitions';
import type { InputController } from '../../input/InputController';
import type { GameSettings } from '../../settings/Settings';

/** Pre-manifest world width, retained only to migrate a save's `playerX`
 * from that era forward (see restoreState) — the live world width now
 * comes from the manifest's `worldWidth` field. */
const LEGACY_WORLD_WIDTH = 5600;
const WALK_SPEED = 390;
/** Reduced motion slows the walk itself (not just the animation) so the feet
 * stay planted on the street. */
const REDUCED_MOTION_WALK_FACTOR = 0.78;
/** A click-to-move target within this many px of the player counts as arrived, rather than the walk oscillating
 * forever around a target it can only approach in speed-sized steps. */
const CLICK_ARRIVAL_THRESHOLD = 6;
/** How far below the manifest's ground line the character's soles rest. */
const PLAYER_SOLE_OFFSET = 14;
/** Shoe-print shadow: the print is a shoe seen from above on the street, so it
 * is foreshortened to a flat oval. Sizes are display px. */
const FOOTPRINT_LENGTH = 46;
const FOOTPRINT_DEPTH = 13;
const FOOTPRINT_COLOR = 0x160f0c;
const FOOTPRINT_ALPHA = 0.34;
/** A faint contact shadow under the torso ties the two prints together. */
const TORSO_SHADOW = { width: 44, height: 12, alpha: 0.12 };

/** The level-up confetti burst: a generated texture key (no art asset needed for the bits themselves) and the
 * game's own gold/cream/deco-red palette. */
const CONFETTI_TEXTURE_KEY = 'confetti-particle';
const CONFETTI_COLORS = [0xd8ad58, 0xf5e2ab, 0xc0392b, 0xffffff];

function planeKey(id: string): string {
  return `plane:${id}`;
}

function propKey(id: string): string {
  return `prop:${id}`;
}

function buildingKey(id: string): string {
  return `building:${id}`;
}

function buildingActiveKey(id: string): string {
  return `building:${id}:active`;
}

/** A street-wall building whose art changes with time slot or world state.
 * Only buildings with an active-state texture are tracked. */
interface DynamicBuilding {
  readonly image: Phaser.GameObjects.Image;
  readonly baseKey: string;
  readonly activeKey: string;
  readonly rule: BoulevardActiveRule;
  active: boolean;
}

function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

/** A single interactable point along the Boulevard: proximity radius,
 * interaction prompt, and what happens on "E". Introduced in round 15 once
 * a third location (the boarding house) made the previous if/else-per-
 * location chain in `update()` worth generalizing — the same "generalize
 * once it happens a third time" call round 14 made for the hanging-sign
 * drawing code. Position, label, radius, and sign styling now come from
 * data/boulevard-manifest.json rather than being hardcoded here; onEnter
 * stays in code since it's real gameplay wiring, not an art/layout knob. */
interface InteractionPoint {
  readonly x: number;
  readonly radius: number;
  readonly label: string;
  readonly onEnter: () => void;
}

export class BoulevardSpikeScene extends Phaser.Scene {
  private inputController!: InputController;
  private settings!: GameSettings;
  private domainEvents!: DomainEventBus;
  private careerState!: CareerState;
  private manifest!: BoulevardManifest;
  private worldWidth = 0;
  private groundY = 0;
  private player!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Graphics;
  private walkCycle: WalkCycle = DEFAULT_WALK_CYCLE;
  /** The texture key of the chosen character's walk sheet. Each character has their own key, so choosing a different one
   * on a later career loads their sheet instead of finding the previous character's in Phaser's cache. */
  private playerTextureKey = 'player:white-male';
  /** Total world px walked, driving the frame shown; see WalkCycle.ts. */
  private walkDistance = 0;
  private walking = false;
  private atmosphericTweens: Phaser.Tweens.Tween[] = [];
  private dynamicBuildings: DynamicBuilding[] = [];
  private promptVisible = false;
  private promptLabel = '';
  private interactionPoints: readonly InteractionPoint[] = [];
  private unsubscribers: Array<() => void> = [];
  private stateClock = 0;
  /** The progression level last reported via 'level-up', kept in step with `careerState` at every point it is set
   * fresh (a new career, a restore) rather than mutated — see emitState. */
  private lastEmittedLevel = 1;
  /** The sky plane's accumulated drift offset and its pool of alternating-mirror tiles — see SkyDrift.ts. */
  private skyDriftX = 0;
  private skyTiles: Phaser.GameObjects.Image[] = [];
  private skyTileWidth = 0;
  /** Click-to-move's target, or undefined when nothing is pending — see update(). */
  private clickTargetX: number | undefined;
  /** The Career panel covers only part of the screen and isn't a native <dialog>, so unlike every other panel a
   * click can still land on the still-visible street while it's open — this suppresses that. */
  private statusPanelOpen = false;

  public constructor() {
    super('BoulevardSpikeScene');
  }

  public preload(): void {
    this.manifest = this.registry.get('boulevardManifest') as BoulevardManifest;

    for (const plane of this.manifest.planes) {
      this.load.image(planeKey(plane.id), assetUrl(plane.path));
    }
    for (const building of this.manifest.buildings) {
      this.load.image(buildingKey(building.id), assetUrl(building.path));
      if (building.activePath !== null) {
        this.load.image(buildingActiveKey(building.id), assetUrl(building.activePath));
      }
    }
    for (const prop of this.manifest.props) {
      this.load.image(propKey(prop.id), assetUrl(prop.path));
    }
    this.walkCycle = (this.registry.get('walkCycle') as WalkCycle | undefined) ?? DEFAULT_WALK_CYCLE;
    this.playerTextureKey = `player:${(this.registry.get('playerCharacterId') as string | undefined) ?? 'white-male'}`;
    this.load.spritesheet(this.playerTextureKey, assetUrl(this.walkCycle.sheet), {
      frameWidth: this.walkCycle.frameWidth,
      frameHeight: this.walkCycle.frameHeight,
    });
  }

  public create(): void {
    this.inputController = this.registry.get('inputController') as InputController;
    this.settings = this.registry.get('settings') as GameSettings;
    this.domainEvents = this.registry.get('domainEvents') as DomainEventBus;
    this.careerState = createDefaultCareerState();
    this.lastEmittedLevel = this.careerState.progression.level;
    // Phaser reuses this scene object when the game restarts it (Continue, a new career), so forget the last prompt: the
    // page has taken it down, and it must be announced again if the player is standing at an entrance.
    this.promptVisible = false;
    this.promptLabel = '';
    this.worldWidth = this.manifest.worldWidth;
    this.groundY = this.manifest.groundY;
    this.cameras.main.setBackgroundColor('#68b9ef');
    this.createRenderedEnvironment();
    this.createPlayer();
    this.ensureConfettiTexture();

    this.cameras.main.setBounds(0, 0, this.worldWidth, 1080);
    this.cameras.main.startFollow(this.player, true, 0.085, 0.085);
    this.cameras.main.setDeadzone(520, 290);

    // Entrances whose scene is not written yet (`enterable: false`, today
    // only the alley) keep their sign but get no prompt and no interaction
    // point.
    this.interactionPoints = this.manifest.locations
      .filter((location) => location.enterable)
      .map((location) => ({
        x: location.x,
        radius: location.radius,
        label: location.promptLabel,
        onEnter: () => this.enterLocation(location.id),
      }));

    this.unsubscribers = [
      this.domainEvents.on('settings-changed', this.onSettingsChanged),
      this.domainEvents.on('restore-career-state', this.restoreState),
      this.domainEvents.on('advance-time-requested', this.onAdvanceTimeRequested),
      this.domainEvents.on('dialogue-choice-selected', this.onDialogueChoiceSelected),
      this.domainEvents.on('talent-unlock-requested', this.onTalentUnlockRequested),
      this.domainEvents.on('audition-submitted', this.onAuditionSubmitted),
      this.domainEvents.on('assignment-start-requested', this.onAssignmentStartRequested),
      this.domainEvents.on('housing-upgrade-requested', this.onHousingUpgradeRequested),
      this.domainEvents.on('level-up-celebration', this.onLevelUpCelebration),
      this.domainEvents.on('status-panel-visibility-changed', this.onStatusPanelVisibilityChanged),
    ];
    this.input.on('pointerdown', this.onPointerDown);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const unsubscribe of this.unsubscribers) unsubscribe();
      this.unsubscribers = [];
      this.input.off('pointerdown', this.onPointerDown);
    });
    this.applyMotionSettings();
    const initialState = this.registry.get('initialCareerState') as CareerState | undefined;
    if (initialState !== undefined) this.restoreState(initialState);
    else this.emitState();
  }

  public override update(_time: number, delta: number): void {
    if (!this.settings.reducedMotion) this.skyDriftX += SKY_DRIFT_PX_PER_SEC * (delta / 1000);
    this.applySkyTileLayout();
    const direction = this.currentDirection();
    const speed = this.settings.reducedMotion ? WALK_SPEED * REDUCED_MOTION_WALK_FACTOR : WALK_SPEED;
    const previousX = this.player.x;
    this.player.x = Phaser.Math.Clamp(
      this.player.x + direction * speed * (delta / 1000),
      110,
      this.worldWidth - 110,
    );
    // Measure the ground actually covered, so pushing against the world's edge
    // holds the feet still instead of walking on the spot.
    const moved = Math.abs(this.player.x - previousX);
    if (direction !== 0) this.player.setFlipX(direction < 0);

    if (moved > 0) {
      if (!this.walking) {
        // Start the loop from the standing pose rather than popping to another frame.
        this.walking = true;
        this.walkDistance = distanceForFrame(this.walkCycle, this.walkCycle.idleFrame % this.walkCycle.frameCount);
      }
      this.walkDistance += moved;
      this.setPlayerFrame(walkFrameAt(this.walkCycle, this.walkDistance));
    } else if (this.walking) {
      this.walking = false;
      this.setPlayerFrame(this.walkCycle.idleFrame);
    }

    const nearest = nearestInteractable(this.interactionPoints, this.player.x);
    const label = nearest?.label ?? '';
    const visible = nearest !== undefined;
    if (visible !== this.promptVisible || label !== this.promptLabel) {
      this.promptVisible = visible;
      this.promptLabel = label;
      this.domainEvents.emit('interaction-proximity-changed', { visible, label });
    }
    if (nearest !== undefined && this.inputController.consumePress('interact')) {
      nearest.onEnter();
      this.emitState();
    }

    this.stateClock += delta;
    if (this.stateClock >= 250) {
      this.stateClock = 0;
      this.resolvePendingAssignment();
      this.emitState();
    }
  }

  /** Keyboard always wins and cancels any pending click-walk; otherwise steers toward clickTargetX (arriving
   * clears it); otherwise stands still. Produces the same -1/0/1 direction keyboard input always has, so every
   * downstream use (speed, animation, world-bounds clamp) needs no click-to-move-specific handling at all. */
  private currentDirection(): number {
    const keyboardDirection = Number(this.inputController.isDown('moveRight')) - Number(this.inputController.isDown('moveLeft'));
    if (keyboardDirection !== 0) {
      this.clickTargetX = undefined;
      return keyboardDirection;
    }
    if (this.clickTargetX === undefined) return 0;
    const distanceToTarget = this.clickTargetX - this.player.x;
    if (Math.abs(distanceToTarget) < CLICK_ARRIVAL_THRESHOLD) {
      this.clickTargetX = undefined;
      return 0;
    }
    return Math.sign(distanceToTarget);
  }

  private enterLocation(id: string): void {
    switch (id) {
      case 'boarding-house': {
        // Unlike the other cases below, this resolves any due idle
        // assignment and refreshes state *before* announcing the location,
        // so the Home Hub screen (which reacts to 'home-hub-entered') has
        // an already-up-to-date career state — including any reward just
        // applied — rather than the stale snapshot the shell would
        // otherwise hold until this frame's trailing emitState() call.
        const { state, resolution } = resolveActiveAssignment(this.careerState, ALL_ASSIGNMENTS, ALL_RELATIONSHIP_CHARACTERS, Date.now());
        this.careerState = state;
        this.emitState();
        this.domainEvents.emit('home-hub-entered', { resolution });
        return;
      }
      case 'casting-office':
        this.careerState = enterCastingOffice(this.careerState);
        this.domainEvents.emit('casting-office-entered', undefined);
        return;
      case 'diner':
        this.domainEvents.emit('diner-entered', undefined);
        return;
      case 'backlot-gate':
        this.domainEvents.emit('backlot-gate-entered', undefined);
        return;
      case 'extras-corral':
        this.domainEvents.emit('extras-corral-entered', undefined);
        return;
      case 'soundstage':
        this.domainEvents.emit('soundstage-entered', undefined);
        return;
      case 'costume-shop':
        this.domainEvents.emit('costume-shop-entered', undefined);
        return;
      case 'klieg-light-office':
        this.domainEvents.emit('klieg-light-entered', undefined);
        return;
      case 'celestial-palace':
        this.domainEvents.emit('celestial-palace-entered', undefined);
        return;
      default:
        return;
    }
  }

  private createRenderedEnvironment(): void {
    for (const plane of this.manifest.planes) {
      const key = planeKey(plane.id);
      if (plane.id === 'sky') {
        // Always drifting on its own clock, independent of the player's position -- a different concern from
        // repeatX's static world-space tiling below, so it gets its own path regardless of the plane's own
        // repeatX value. See createSkyTiles/SkyDrift.ts.
        this.createSkyTiles(plane);
        continue;
      }
      if (plane.repeatX) {
        // The ground is one seamless, mirrored tile repeated across the world.
        // Separate images rather than a TileSprite: the texture is not a power
        // of two, and a TileSprite would have to resample it.
        const tileWidth = this.textures.get(key).getSourceImage().width * plane.scale;
        for (let x = plane.offsetX; x < this.worldWidth; x += tileWidth) {
          this.add.image(x, plane.offsetY, key).setOrigin(0).setScale(plane.scale).setScrollFactor(plane.scrollFactor).setDepth(plane.depth);
        }
        continue;
      }
      // Uniform scale, never stretched to the world width.
      this.add
        .image(plane.offsetX, plane.offsetY, key)
        .setOrigin(0)
        .setScale(plane.scale)
        .setScrollFactor(plane.scrollFactor)
        .setDepth(plane.depth);
    }

    this.dynamicBuildings = [];
    for (const building of this.manifest.buildings) {
      const image = this.add
        .image(building.x, building.y, buildingKey(building.id))
        .setOrigin(0, 1)
        .setScale(building.scale)
        .setDepth(building.depth);
      if (building.activePath !== null && building.activeWhen !== null) {
        this.dynamicBuildings.push({
          image,
          baseKey: buildingKey(building.id),
          activeKey: buildingActiveKey(building.id),
          rule: building.activeWhen,
          active: false,
        });
      }
    }

    for (const prop of this.manifest.props) {
      this.add
        .image(prop.x, prop.y, propKey(prop.id))
        .setOrigin(0.5, 1)
        .setScale(prop.scale)
        .setFlipX(prop.flipX)
        .setDepth(prop.depth);
    }

    for (const location of this.manifest.locations) {
      if (location.sign === null || location.sign.painted === true) continue;
      if (location.sign.textOnly) {
        this.createSignText(location.sign);
        continue;
      }
      this.createSignGlow(location.sign.x, location.sign.y);
      this.createHangingSign(location.sign);
    }

    for (let index = 0; index < 22; index += 1) {
      const mote = this.add
        .circle(80 + index * 119, 520 + (index % 6) * 57, 2 + (index % 3), 0xffe8ae, 0.2)
        .setDepth(35)
        .setScrollFactor(0.72);
      this.atmosphericTweens.push(
        this.tweens.add({
          targets: mote,
          x: mote.x + 48 + (index % 4) * 16,
          y: mote.y - 34 - (index % 3) * 12,
          alpha: { from: 0.08, to: 0.34 },
          duration: 4200 + index * 130,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        }),
      );
    }

    const vignette = this.add.graphics().setScrollFactor(0).setDepth(50);
    vignette.lineStyle(100, 0x261713, 0.12).strokeRect(-32, -32, 1984, 1144);
  }

  /** Builds the sky's pool of alternating-mirror tiles (see SkyDrift.ts) and places them once, so there is no
   * one-frame flash at the wrong position before the first update(). Re-run in full every create() (the scene is
   * reused across Continue/a new career), so the drift offset and the tile pool both reset with it. */
  private createSkyTiles(plane: BoulevardPlane): void {
    const key = planeKey(plane.id);
    this.skyDriftX = 0;
    this.skyTileWidth = this.textures.get(key).getSourceImage().width * plane.scale;
    this.skyTiles = Array.from({ length: skyTileCount(this.skyTileWidth, this.cameras.main.width) }, () =>
      this.add
        .image(0, plane.offsetY, key)
        .setOrigin(0)
        .setScale(plane.scale)
        .setScrollFactor(plane.scrollFactor)
        .setDepth(plane.depth)
        // The drift is deliberately sub-pixel-per-frame (SKY_DRIFT_PX_PER_SEC is slow), so the game's global
        // roundPixels snapping (createGame.ts) would hold each tile at the same rounded position for several
        // frames, then jump it a whole pixel — the "jittery, not smooth" motion. Every other GameObject in the
        // scene still wants that crisp snapping; only these tiles need real sub-pixel motion to look smooth.
        .setVertexRoundMode('off'),
    );
    this.applySkyTileLayout();
  }

  private applySkyTileLayout(): void {
    const layout = skyTileLayout(this.skyDriftX, this.skyTileWidth, this.skyTiles.length);
    this.skyTiles.forEach((tile, index) => {
      const placement = layout[index];
      if (placement === undefined) return;
      tile.setX(placement.x).setFlipX(placement.flipped);
    });
  }

  /** The soft pulsing glow behind a hanging sign — factored out once round
   * 14 added a second interactable location reusing the casting office's
   * original one-off effect. */
  private createSignGlow(x: number, y: number): void {
    const glow = this.add
      .ellipse(x, y, 170, 175, 0xffc95f, 0.07)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(4);
    this.atmosphericTweens.push(
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.035, to: 0.11 },
        scaleX: { from: 0.96, to: 1.04 },
        duration: 1900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      }),
    );
  }

  /** A hand-drawn hanging sign board — frame, inset panel, and corner
   * rivets — mounted above an interactable location's door. Originally
   * built for the casting office alone; generalized in round 14 to also
   * mark the diner, reusing the same background art rather than adding
   * new location-specific assets. Text, board size/color, and font size
   * now come from the location's manifest entry; the rivet/frame trim
   * colors and glow stay fixed, matching the Art Director tool's "text +
   * basic style" scope for signs. */
  private createHangingSign(sign: BoulevardSign): void {
    const { x, y, boardWidth: width, boardHeight: height } = sign;
    const left = x - width / 2;
    const top = y - height / 2;
    const inset = 9;
    const boardColor = Phaser.Display.Color.HexStringToColor(sign.boardColor).color;

    const frame = this.add.graphics().setDepth(4.5);
    frame.fillStyle(0x120c08, 0.35);
    frame.fillRoundedRect(left + 4, top + 6, width, height, 8);
    frame.fillStyle(boardColor, 1);
    frame.fillRoundedRect(left, top, width, height, 8);
    frame.fillStyle(0x40270f, 1);
    frame.fillRoundedRect(left + inset, top + inset, width - inset * 2, height - inset * 2, 5);
    frame.lineStyle(2, 0xd8ad58, 0.85);
    frame.strokeRoundedRect(left + inset, top + inset, width - inset * 2, height - inset * 2, 5);
    frame.lineStyle(3, 0x120c08, 0.7);
    frame.strokeRoundedRect(left, top, width, height, 8);

    const rivetOffset = 15;
    const rivetCorners: ReadonlyArray<readonly [number, number]> = [
      [left + rivetOffset, top + rivetOffset],
      [left + width - rivetOffset, top + rivetOffset],
      [left + rivetOffset, top + height - rivetOffset],
      [left + width - rivetOffset, top + height - rivetOffset],
    ];
    for (const [rx, ry] of rivetCorners) {
      frame.fillStyle(0x0f0906, 0.8);
      frame.fillCircle(rx + 0.6, ry + 0.6, 4);
      frame.fillStyle(0xb98a45, 1);
      frame.fillCircle(rx, ry, 3.6);
      frame.fillStyle(0xf3d99a, 0.85);
      frame.fillCircle(rx - 1, ry - 1, 1.2);
    }

    this.createSignText(sign);
  }

  /** The sign's lettering. For `textOnly` signs this is the whole sign: the
   * v3 building art already has a blank panel painted where the name goes,
   * so only the text is drawn (tighter tracking and no drop shadow, since
   * it sits on a painted surface rather than a board). */
  private createSignText(sign: BoulevardSign): void {
    this.add
      .text(sign.x, sign.y, sign.text, {
        color: sign.textColor,
        fontFamily: 'Georgia, serif',
        fontSize: `${sign.fontSize}px`,
        fontStyle: 'bold',
        letterSpacing: sign.textOnly ? 1 : 2,
        align: 'center',
        lineSpacing: sign.textOnly ? 2 : 4,
        ...(sign.textOnly ? {} : { shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true } }),
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  /** Swaps each stateful building between its default and active art from
   * the current career state (time slot, world flags). Called from
   * emitState, so it runs on the same beat as every other state change. */
  private applyBuildingStates(): void {
    for (const building of this.dynamicBuildings) {
      const active = isBuildingActive(building.rule, this.careerState);
      if (active === building.active) continue;
      building.active = active;
      building.image.setTexture(active ? building.activeKey : building.baseKey);
    }
  }

  private createPlayer(): void {
    const cycle = this.walkCycle;
    this.playerShadow = this.add.graphics().setDepth(28);
    this.player = this.add
      .sprite(DEFAULT_PLAYER_X, this.groundY + PLAYER_SOLE_OFFSET, this.playerTextureKey, cycle.idleFrame)
      .setOrigin(0.5, cycle.soleY / cycle.frameHeight)
      .setScale(cycle.displayScale)
      .setDepth(30);
    this.drawPlayerShadow();
  }

  private setPlayerFrame(frame: number): void {
    if (Number(this.player.frame.name) !== frame) this.player.setFrame(frame);
    this.drawPlayerShadow();
  }

  /** Two shoe prints that follow the drawn feet through the cycle (a lifted
   * foot's print shrinks and fades) plus a faint torso contact shadow. */
  private drawPlayerShadow(): void {
    const shadow = this.playerShadow;
    const facing = this.player.flipX ? -1 : 1;
    const y = this.groundY + PLAYER_SOLE_OFFSET + 1;
    shadow.clear();
    shadow.fillStyle(FOOTPRINT_COLOR, TORSO_SHADOW.alpha);
    shadow.fillEllipse(this.player.x, y, TORSO_SHADOW.width, TORSO_SHADOW.height);
    const prints = footprintsForFrame(this.walkCycle, Number(this.player.frame.name));
    for (const print of prints) {
      const grow = 1 - 0.3 * print.lift;
      shadow.fillStyle(FOOTPRINT_COLOR, FOOTPRINT_ALPHA * (1 - 0.65 * print.lift));
      shadow.fillEllipse(this.player.x + facing * print.dx, y, FOOTPRINT_LENGTH * grow, FOOTPRINT_DEPTH * grow);
    }
    if (prints.length === 0) {
      shadow.fillStyle(FOOTPRINT_COLOR, FOOTPRINT_ALPHA);
      shadow.fillEllipse(this.player.x, y, FOOTPRINT_LENGTH * 1.6, FOOTPRINT_DEPTH);
    }
  }

  private emitState(): void {
    this.careerState = { ...this.careerState, playerX: Math.round(this.player.x) };
    this.applyBuildingStates();
    const level = this.careerState.progression.level;
    if (level > this.lastEmittedLevel) this.domainEvents.emit('level-up', { level });
    this.lastEmittedLevel = level;
    this.domainEvents.emit('career-state-changed', this.careerState);
  }

  private applyMotionSettings(): void {
    for (const tween of this.atmosphericTweens) tween.paused = this.settings.reducedMotion;
  }

  /** Resolves a due idle assignment wherever the player happens to be, not
   * just at the boarding-house door (see `enterLocation`'s own 'boarding-house'
   * case, which resolves too, so the Home Hub's away-summary card still shows
   * for the common "walk straight to the door" case). Safe to call
   * unconditionally and often: `resolveActiveAssignment` is a cheap no-op
   * when nothing is active or nothing is due yet. Called on load
   * (`restoreState`) and on the state-clock heartbeat below so an assignment
   * finishing while the player is elsewhere on the Boulevard (or the game was
   * simply closed and reopened later) still pays out and tells the player,
   * instead of silently waiting for them to specifically re-visit the door. */
  private resolvePendingAssignment(): void {
    const { state, resolution } = resolveActiveAssignment(this.careerState, ALL_ASSIGNMENTS, ALL_RELATIONSHIP_CHARACTERS, Date.now());
    this.careerState = state;
    if (resolution !== undefined) this.domainEvents.emit('assignment-resolved-away', resolution);
  }

  private readonly restoreState = (state: CareerState): void => {
    const migratedX =
      state.playerX > this.worldWidth
        ? Math.round((state.playerX / LEGACY_WORLD_WIDTH) * this.worldWidth)
        : state.playerX;
    this.player.x = Phaser.Math.Clamp(migratedX, 110, this.worldWidth - 110);
    this.drawPlayerShadow();
    this.careerState = state;
    this.lastEmittedLevel = state.progression.level;
    this.resolvePendingAssignment();
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.emitState();
  };

  private readonly onSettingsChanged = (settings: GameSettings): void => {
    this.settings = settings;
    this.applyMotionSettings();
  };

  private readonly onAdvanceTimeRequested = (): void => {
    this.careerState = advanceTime(this.careerState);
    this.emitState();
  };

  private readonly onDialogueChoiceSelected = (payload: DialogueChoiceSelectedPayload): void => {
    const graph = getDialogueGraphById(payload.graphId);
    if (graph === undefined) return;
    this.careerState = applyDialogueChoiceById(
      this.careerState,
      graph,
      payload.nodeId,
      payload.choiceId,
      ALL_QUESTS,
      ALL_RELATIONSHIP_CHARACTERS,
      ALL_ITEMS,
    );
    this.emitState();
  };

  private readonly onTalentUnlockRequested = (payload: TalentUnlockRequestedPayload): void => {
    const talent = getTalentById(payload.talentId);
    if (talent === undefined) return;
    this.careerState = unlockTalent(this.careerState, talent);
    this.emitState();
  };

  private readonly onAssignmentStartRequested = (payload: AssignmentStartRequestedPayload): void => {
    const definition = getAssignmentById(ALL_ASSIGNMENTS, payload.assignmentId);
    if (definition === undefined) return;
    this.careerState = startAssignment(this.careerState, definition, Date.now());
    this.emitState();
  };

  private readonly onHousingUpgradeRequested = (): void => {
    this.careerState = purchaseHousingUpgrade(this.careerState);
    this.emitState();
  };

  /** AppShell's "safe to celebrate" signal (see DomainEventBus): the confetti burst, not the raw 'level-up' fact,
   * so it lands at the same moment as the overlay and the SFX even when the level-up itself happened mid-dialogue. */
  private readonly onLevelUpCelebration = (): void => {
    if (this.settings.reducedMotion) return;
    this.burstConfetti();
  };

  private readonly onStatusPanelVisibilityChanged = ({ open }: StatusPanelVisibilityChangedPayload): void => {
    this.statusPanelOpen = open;
  };

  /** Click-to-move: sets clickTargetX for update()'s currentDirection() to steer toward. Ignored while the
   * Career panel covers part of the screen (see statusPanelOpen); every other panel is a native <dialog>, already
   * modal to pointer events over the whole page, so no other guard is needed here. */
  private readonly onPointerDown = (pointer: Phaser.Input.Pointer): void => {
    if (this.statusPanelOpen) return;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.clickTargetX = Phaser.Math.Clamp(worldPoint.x, 110, this.worldWidth - 110);
  };

  /** Generated once (idempotent across scene restarts, which re-run create()) so the burst needs no art asset of
   * its own: a small rectangle, tinted per-particle from CONFETTI_COLORS. */
  private ensureConfettiTexture(): void {
    if (this.textures.exists(CONFETTI_TEXTURE_KEY)) return;
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 8, 14);
    graphics.generateTexture(CONFETTI_TEXTURE_KEY, 8, 14);
    graphics.destroy();
  }

  /** Screen-space (scrollFactor 0), above the vignette, so it reads as a burst over the whole view rather than a
   * puff tied to one spot in the world. Self-destroys once every particle's lifespan has run out. */
  private burstConfetti(): void {
    const width = this.cameras.main.width;
    const emitter = this.add
      .particles(0, 0, CONFETTI_TEXTURE_KEY, {
        x: { min: 0, max: width },
        y: -20,
        lifespan: 2200,
        speedY: { min: 220, max: 420 },
        speedX: { min: -60, max: 60 },
        angle: { min: 0, max: 360 },
        rotate: { min: 0, max: 360 },
        scale: { min: 0.6, max: 1.1 },
        gravityY: 260,
        tint: CONFETTI_COLORS,
        emitting: false,
      })
      .setScrollFactor(0)
      .setDepth(60);
    emitter.explode(113);
    this.time.delayedCall(2400, () => emitter.destroy());
  }

  /** No randomness in `resolveAudition` (see Performance.ts), so the debrief
   * this emits is exactly what committing `applyAuditionOutcome` below
   * produces — the shell never needs to guess at or duplicate the result. */
  private readonly onAuditionSubmitted = (payload: AuditionSubmittedPayload): void => {
    const definition = getAuditionById(payload.auditionId);
    if (definition === undefined) return;
    const result = resolveAudition(this.careerState, definition, payload.choices, ALL_RELATIONSHIP_CHARACTERS, ALL_ITEMS);
    this.careerState = applyAuditionOutcome(this.careerState, definition, result, ALL_RELATIONSHIP_CHARACTERS);
    this.domainEvents.emit('audition-resolved', { auditionId: payload.auditionId, result });
    this.emitState();
  };
}
