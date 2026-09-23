import Phaser from 'phaser';

import type { BoulevardActiveRule, BoulevardManifest, BoulevardSign } from '../BoulevardManifest';
import { isBuildingActive, nearestInteractable } from '../BoulevardStates';
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
import type { AssignmentStartRequestedPayload, AuditionSubmittedPayload, DomainEventBus } from '../../domain/DomainEventBus';
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
    // Phaser reuses this scene object when the game restarts it (Continue, a new career), so forget the last prompt: the
    // page has taken it down, and it must be announced again if the player is standing at an entrance.
    this.promptVisible = false;
    this.promptLabel = '';
    this.worldWidth = this.manifest.worldWidth;
    this.groundY = this.manifest.groundY;
    this.cameras.main.setBackgroundColor('#68b9ef');
    this.createRenderedEnvironment();
    this.createPlayer();

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
    ];
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const unsubscribe of this.unsubscribers) unsubscribe();
      this.unsubscribers = [];
    });
    this.applyMotionSettings();
    const initialState = this.registry.get('initialCareerState') as CareerState | undefined;
    if (initialState !== undefined) this.restoreState(initialState);
    else this.emitState();
  }

  public override update(_time: number, delta: number): void {
    const direction =
      Number(this.inputController.isDown('moveRight')) -
      Number(this.inputController.isDown('moveLeft'));
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
