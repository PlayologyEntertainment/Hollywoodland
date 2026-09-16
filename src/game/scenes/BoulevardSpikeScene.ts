import Phaser from 'phaser';

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

const WORLD_WIDTH = 3790;
const LEGACY_WORLD_WIDTH = 5600;
const HILLS_OFFSET_X = -330;
const HILLS_OFFSET_Y = -230;
const MAIN_ARCHITECTURE_OFFSET_Y = -117;
const GROUND_PLANE_OFFSET_Y = 430;
const GROUND_Y = 626 + GROUND_PLANE_OFFSET_Y;
const WALK_SPEED = 390;
const INTERACTION_RADIUS = 205;
const BOARDING_HOUSE_X = 1150;
const BOARDING_SIGN_X = 1280;
const BOARDING_SIGN_Y = 707;
const BOARDING_PROMPT_LABEL = 'Enter boarding house';
const CASTING_OFFICE_X = 1675;
const CASTING_SIGN_X = 1805;
const CASTING_SIGN_Y = 707;
const CASTING_PROMPT_LABEL = 'Enter casting office';
const DINER_X = 2500;
const DINER_SIGN_X = 2630;
const DINER_SIGN_Y = 707;
const DINER_PROMPT_LABEL = 'Enter Sunset Diner';
const BACKLOT_GATE_X = 3050;
const BACKLOT_SIGN_X = 3180;
const BACKLOT_SIGN_Y = 707;
const BACKLOT_PROMPT_LABEL = 'Wait at the backlot gate';
const EXTRAS_CORRAL_X = 3600;
const EXTRAS_SIGN_X = 3730;
const EXTRAS_SIGN_Y = 707;
const EXTRAS_PROMPT_LABEL = 'Check in at the extras corral';

/** A single interactable point along the Boulevard: proximity radius,
 * interaction prompt, and what happens on "E". Introduced in round 15 once
 * a third location (the boarding house) made the previous if/else-per-
 * location chain in `update()` worth generalizing — the same "generalize
 * once it happens a third time" call round 14 made for the hanging-sign
 * drawing code. */
interface InteractionPoint {
  readonly x: number;
  readonly label: string;
  readonly onEnter: () => void;
}

export class BoulevardSpikeScene extends Phaser.Scene {
  private inputController!: InputController;
  private settings!: GameSettings;
  private domainEvents!: DomainEventBus;
  private careerState!: CareerState;
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
    this.load.image(
      'boulevard-sky',
      `${import.meta.env.BASE_URL}assets/environments/boulevard-v2/01-sky.png`,
    );
    this.load.image(
      'boulevard-hills',
      `${import.meta.env.BASE_URL}assets/environments/boulevard-v2/02-hills-landmark.png`,
    );
    this.load.image(
      'boulevard-distant-buildings',
      `${import.meta.env.BASE_URL}assets/environments/boulevard-v2/03-distant-buildings.png`,
    );
    this.load.image(
      'boulevard-main-architecture',
      `${import.meta.env.BASE_URL}assets/environments/boulevard-v2/04-main-architecture.png`,
    );
    this.load.image(
      'boulevard-sidewalk-street',
      `${import.meta.env.BASE_URL}assets/environments/boulevard-v2/05-sidewalk-street.png`,
    );
    this.load.image(
      'hollywood-palm',
      `${import.meta.env.BASE_URL}assets/environments/foreground/hollywood-palm-v1.png`,
    );
    this.load.image(
      'hollywood-streetlamp',
      `${import.meta.env.BASE_URL}assets/environments/foreground/hollywood-streetlamp-v1.png`,
    );
    this.load.image(
      'hollywood-sedan',
      `${import.meta.env.BASE_URL}assets/environments/foreground/hollywood-sedan-v1.png`,
    );
    this.load.spritesheet(
      'aspiring-actor',
      `${import.meta.env.BASE_URL}assets/characters/aspiring-actor-walk.webp`,
      { frameWidth: 384, frameHeight: 512 },
    );
  }

  public create(): void {
    this.inputController = this.registry.get('inputController') as InputController;
    this.settings = this.registry.get('settings') as GameSettings;
    this.domainEvents = this.registry.get('domainEvents') as DomainEventBus;
    this.careerState = createDefaultCareerState();
    this.cameras.main.setBackgroundColor('#68b9ef');
    this.createRenderedEnvironment();
    this.createPlayer();

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 1080);
    this.cameras.main.startFollow(this.player, true, 0.085, 0.085);
    this.cameras.main.setDeadzone(520, 290);

    this.interactionPoints = [
      {
        x: BOARDING_HOUSE_X,
        label: BOARDING_PROMPT_LABEL,
        onEnter: () => this.domainEvents.emit('boarding-house-entered', undefined),
      },
      {
        x: CASTING_OFFICE_X,
        label: CASTING_PROMPT_LABEL,
        onEnter: () => {
          this.careerState = enterCastingOffice(this.careerState);
          this.domainEvents.emit('casting-office-entered', undefined);
        },
      },
      { x: DINER_X, label: DINER_PROMPT_LABEL, onEnter: () => this.domainEvents.emit('diner-entered', undefined) },
      {
        x: BACKLOT_GATE_X,
        label: BACKLOT_PROMPT_LABEL,
        onEnter: () => this.domainEvents.emit('backlot-gate-entered', undefined),
      },
      {
        x: EXTRAS_CORRAL_X,
        label: EXTRAS_PROMPT_LABEL,
        onEnter: () => this.domainEvents.emit('extras-corral-entered', undefined),
      },
    ];

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
      WORLD_WIDTH - 110,
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
      (point) => Math.abs(this.player.x - point.x) < INTERACTION_RADIUS,
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

  private createRenderedEnvironment(): void {
    this.add
      .image(0, 0, 'boulevard-sky')
      .setOrigin(0)
      .setDisplaySize(WORLD_WIDTH, 1080)
      .setScrollFactor(0)
      .setDepth(0);

    this.add
      .image(HILLS_OFFSET_X, HILLS_OFFSET_Y, 'boulevard-hills')
      .setOrigin(0)
      .setDisplaySize(WORLD_WIDTH, 1080)
      .setScrollFactor(0.18)
      .setDepth(1);

    this.add
      .image(0, 0, 'boulevard-distant-buildings')
      .setOrigin(0)
      .setDisplaySize(WORLD_WIDTH, 1080)
      .setScrollFactor(0.42)
      .setDepth(2);

    this.add
      .image(0, MAIN_ARCHITECTURE_OFFSET_Y, 'boulevard-main-architecture')
      .setOrigin(0)
      .setDisplaySize(WORLD_WIDTH, 1080)
      .setDepth(3);

    this.add
      .image(0, GROUND_PLANE_OFFSET_Y, 'boulevard-sidewalk-street')
      .setOrigin(0)
      .setDisplaySize(WORLD_WIDTH, 1080)
      .setDepth(10);

    this.add
      .image(90, 650 + GROUND_PLANE_OFFSET_Y, 'hollywood-palm')
      .setOrigin(0.5, 1)
      .setScale(0.8)
      .setDepth(8);
    this.add
      .image(WORLD_WIDTH - 95, 650 + GROUND_PLANE_OFFSET_Y, 'hollywood-palm')
      .setOrigin(0.5, 1)
      .setScale(0.9)
      .setFlipX(true)
      .setDepth(8);

    this.add
      .image(935, 654 + GROUND_PLANE_OFFSET_Y, 'hollywood-streetlamp')
      .setOrigin(0.5, 1)
      .setScale(0.74)
      .setDepth(14);
    this.add
      .image(2035, 654 + GROUND_PLANE_OFFSET_Y, 'hollywood-streetlamp')
      .setOrigin(0.5, 1)
      .setScale(0.74)
      .setFlipX(true)
      .setDepth(14);

    this.add
      .image(685, 862 + GROUND_PLANE_OFFSET_Y, 'hollywood-sedan')
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setDepth(24);

    const boardingSignCenterY = BOARDING_SIGN_Y + MAIN_ARCHITECTURE_OFFSET_Y;
    this.createSignGlow(BOARDING_SIGN_X, boardingSignCenterY);
    this.createHangingSign(BOARDING_SIGN_X, boardingSignCenterY, 'BOARDING\nHOUSE');

    const signCenterY = CASTING_SIGN_Y + MAIN_ARCHITECTURE_OFFSET_Y;
    this.createSignGlow(CASTING_SIGN_X, signCenterY);
    this.createHangingSign(CASTING_SIGN_X, signCenterY, 'SUNSET\nCASTING\nEXCHANGE');

    const dinerSignCenterY = DINER_SIGN_Y + MAIN_ARCHITECTURE_OFFSET_Y;
    this.createSignGlow(DINER_SIGN_X, dinerSignCenterY);
    this.createHangingSign(DINER_SIGN_X, dinerSignCenterY, 'SUNSET\nDINER');

    const backlotSignCenterY = BACKLOT_SIGN_Y + MAIN_ARCHITECTURE_OFFSET_Y;
    this.createSignGlow(BACKLOT_SIGN_X, backlotSignCenterY);
    this.createHangingSign(BACKLOT_SIGN_X, backlotSignCenterY, 'BACKLOT\nGATE');

    const extrasSignCenterY = EXTRAS_SIGN_Y + MAIN_ARCHITECTURE_OFFSET_Y;
    this.createSignGlow(EXTRAS_SIGN_X, extrasSignCenterY);
    this.createHangingSign(EXTRAS_SIGN_X, extrasSignCenterY, 'EXTRAS\nCORRAL');

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
   * new location-specific assets. */
  private createHangingSign(x: number, y: number, label: string): void {
    const width = 210;
    const height = 130;
    const left = x - width / 2;
    const top = y - height / 2;
    const inset = 9;

    const frame = this.add.graphics().setDepth(4.5);
    frame.fillStyle(0x120c08, 0.35);
    frame.fillRoundedRect(left + 4, top + 6, width, height, 8);
    frame.fillStyle(0x241609, 1);
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
      .text(x, y, label, {
        color: '#f3dfab',
        fontFamily: 'Georgia, serif',
        fontSize: '19px',
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
      .ellipse(DEFAULT_PLAYER_X, GROUND_Y + 18, 112, 22, 0x160f0c, 0.27)
      .setDepth(28);
    this.player = this.add
      .sprite(DEFAULT_PLAYER_X, GROUND_Y + 22, 'aspiring-actor', 0)
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
      state.playerX > WORLD_WIDTH
        ? Math.round((state.playerX / LEGACY_WORLD_WIDTH) * WORLD_WIDTH)
        : state.playerX;
    this.player.x = Phaser.Math.Clamp(migratedX, 110, WORLD_WIDTH - 110);
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
