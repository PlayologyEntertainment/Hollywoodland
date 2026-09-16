import Phaser from 'phaser';

import type { BoulevardManifest, BoulevardSign } from '../BoulevardManifest';
import { enterCastingOffice, advanceTime } from '../../domain/CareerActions';
import { createDefaultCareerState, DEFAULT_PLAYER_X, type CareerState } from '../../domain/CareerState';
import { applyDialogueChoiceById, type DialogueChoiceSelectedPayload } from '../../domain/Dialogue';
import { getDialogueGraphById } from '../../domain/DialogueGraphs';
import type { DomainEventBus } from '../../domain/DomainEventBus';
import { ALL_ITEMS } from '../../domain/InventoryDefinitions';
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

function planeKey(id: string): string {
  return `plane:${id}`;
}

function propKey(id: string): string {
  return `prop:${id}`;
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
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private atmosphericTweens: Phaser.Tweens.Tween[] = [];
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
    for (const prop of this.manifest.props) {
      this.load.image(propKey(prop.id), assetUrl(prop.path));
    }
    this.load.spritesheet('aspiring-actor', assetUrl('assets/characters/aspiring-actor-walk.webp'), {
      frameWidth: 384,
      frameHeight: 512,
    });
  }

  public create(): void {
    this.inputController = this.registry.get('inputController') as InputController;
    this.settings = this.registry.get('settings') as GameSettings;
    this.domainEvents = this.registry.get('domainEvents') as DomainEventBus;
    this.careerState = createDefaultCareerState();
    this.worldWidth = this.manifest.worldWidth;
    this.groundY = this.manifest.groundY;
    this.cameras.main.setBackgroundColor('#68b9ef');
    this.createRenderedEnvironment();
    this.createPlayer();

    this.cameras.main.setBounds(0, 0, this.worldWidth, 1080);
    this.cameras.main.startFollow(this.player, true, 0.085, 0.085);
    this.cameras.main.setDeadzone(520, 290);

    this.interactionPoints = this.manifest.locations.map((location) => ({
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
    this.player.anims.timeScale = this.settings.reducedMotion ? 0.78 : 1;
    const direction =
      Number(this.inputController.isDown('moveRight')) -
      Number(this.inputController.isDown('moveLeft'));
    this.player.x = Phaser.Math.Clamp(
      this.player.x + direction * WALK_SPEED * (delta / 1000),
      110,
      this.worldWidth - 110,
    );
    this.playerShadow.x = this.player.x;

    if (direction !== 0) {
      this.player.setFlipX(direction < 0);
      if (!this.player.anims.isPlaying) this.player.play('actor-walk');
    } else {
      this.player.stop();
      this.player.setFrame(0);
    }

    const nearest = this.interactionPoints.find(
      (point) => Math.abs(this.player.x - point.x) < point.radius,
    );
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
      this.emitState();
    }
  }

  private enterLocation(id: string): void {
    switch (id) {
      case 'boarding-house':
        this.domainEvents.emit('boarding-house-entered', undefined);
        return;
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
      default:
        return;
    }
  }

  private createRenderedEnvironment(): void {
    for (const plane of this.manifest.planes) {
      this.add
        .image(plane.offsetX, plane.offsetY, planeKey(plane.id))
        .setOrigin(0)
        .setDisplaySize(this.worldWidth, 1080)
        .setScrollFactor(plane.scrollFactor)
        .setDepth(plane.depth);
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

    this.add
      .text(x, y, sign.text, {
        color: sign.textColor,
        fontFamily: 'Georgia, serif',
        fontSize: `${sign.fontSize}px`,
        fontStyle: 'bold',
        letterSpacing: 2,
        align: 'center',
        lineSpacing: 4,
        shadow: { offsetX: 0, offsetY: 1, color: '#000000', blur: 2, fill: true },
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  private createPlayer(): void {
    this.anims.create({
      key: 'actor-walk',
      frames: this.anims.generateFrameNumbers('aspiring-actor', { start: 0, end: 7 }),
      frameRate: 11,
      repeat: -1,
    });
    this.playerShadow = this.add
      .ellipse(DEFAULT_PLAYER_X, this.groundY + 18, 112, 22, 0x160f0c, 0.27)
      .setDepth(28);
    this.player = this.add
      .sprite(DEFAULT_PLAYER_X, this.groundY + 22, 'aspiring-actor', 0)
      .setOrigin(0.5, 1)
      .setScale(0.42)
      .setDepth(30);
  }

  private emitState(): void {
    this.careerState = { ...this.careerState, playerX: Math.round(this.player.x) };
    this.domainEvents.emit('career-state-changed', this.careerState);
  }

  private applyMotionSettings(): void {
    for (const tween of this.atmosphericTweens) tween.paused = this.settings.reducedMotion;
  }

  private readonly restoreState = (state: CareerState): void => {
    const migratedX =
      state.playerX > this.worldWidth
        ? Math.round((state.playerX / LEGACY_WORLD_WIDTH) * this.worldWidth)
        : state.playerX;
    this.player.x = Phaser.Math.Clamp(migratedX, 110, this.worldWidth - 110);
    this.playerShadow.x = this.player.x;
    this.careerState = state;
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
}
