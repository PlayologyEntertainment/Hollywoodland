import Phaser from 'phaser';

import type { PlayState } from '../../app/AppShell';
import type { InputController } from '../../input/InputController';
import type { GameSettings } from '../../settings/Settings';

const WORLD_WIDTH = 2592;
const LEGACY_WORLD_WIDTH = 5600;
const GROUND_Y = 884;
const WALK_SPEED = 390;
const PLAYER_START_X = 420;
const CASTING_OFFICE_X = 1440;

export class BoulevardSpikeScene extends Phaser.Scene {
  private inputController!: InputController;
  private settings!: GameSettings;
  private player!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private atmosphericTweens: Phaser.Tweens.Tween[] = [];
  private promptVisible = false;
  private discoveredCastingOffice = false;
  private stateClock = 0;

  public constructor() {
    super('BoulevardSpikeScene');
  }

  public preload(): void {
    this.load.image(
      'hollywood-boulevard',
      `${import.meta.env.BASE_URL}assets/environments/hollywood-boulevard-concept-v1.webp`,
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
    this.cameras.main.setBackgroundColor('#68b9ef');
    this.createRenderedEnvironment();
    this.createPlayer();

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 1080);
    this.cameras.main.startFollow(this.player, true, 0.085, 0.085);
    this.cameras.main.setDeadzone(520, 290);

    this.game.events.on('settings-changed', this.onSettingsChanged, this);
    this.game.events.on('restore-play-state', this.restoreState, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('settings-changed', this.onSettingsChanged, this);
      this.game.events.off('restore-play-state', this.restoreState, this);
    });
    this.applyMotionSettings();
    this.emitState();
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

    const nearCasting = Math.abs(this.player.x - CASTING_OFFICE_X) < 205;
    if (nearCasting !== this.promptVisible) {
      this.promptVisible = nearCasting;
      this.game.events.emit('interaction-proximity', nearCasting);
    }
    if (nearCasting && this.inputController.consumePress('interact')) {
      this.discoveredCastingOffice = true;
      this.game.events.emit('casting-office-entered');
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
      .image(0, 0, 'hollywood-boulevard')
      .setOrigin(0)
      .setDisplaySize(WORLD_WIDTH, 1080)
      .setDepth(0);

    this.add
      .image(90, 902, 'hollywood-palm')
      .setOrigin(0.5, 1)
      .setScale(0.8)
      .setDepth(8);
    this.add
      .image(WORLD_WIDTH - 95, 902, 'hollywood-palm')
      .setOrigin(0.5, 1)
      .setScale(0.9)
      .setFlipX(true)
      .setDepth(8);

    this.add
      .image(935, 918, 'hollywood-streetlamp')
      .setOrigin(0.5, 1)
      .setScale(0.74)
      .setDepth(14);
    this.add
      .image(2035, 918, 'hollywood-streetlamp')
      .setOrigin(0.5, 1)
      .setScale(0.74)
      .setFlipX(true)
      .setDepth(14);

    this.add
      .image(685, 928, 'hollywood-sedan')
      .setOrigin(0.5, 1)
      .setScale(0.5)
      .setDepth(24);

    const castingGlow = this.add
      .ellipse(CASTING_OFFICE_X, 698, 170, 245, 0xffc95f, 0.07)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(2);
    this.atmosphericTweens.push(
      this.tweens.add({
        targets: castingGlow,
        alpha: { from: 0.035, to: 0.11 },
        scaleX: { from: 0.96, to: 1.04 },
        duration: 1900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      }),
    );

    this.add
      .text(CASTING_OFFICE_X, 577, 'SUNSET CASTING EXCHANGE', {
        color: '#67452b',
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        fontStyle: 'bold',
        letterSpacing: 2,
        stroke: '#f6ddb2',
        strokeThickness: 2,
      })
      .setOrigin(0.5)
      .setDepth(3);

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

  private createPlayer(): void {
    this.anims.create({
      key: 'actor-walk',
      frames: this.anims.generateFrameNumbers('aspiring-actor', { start: 0, end: 7 }),
      frameRate: 11,
      repeat: -1,
    });
    this.playerShadow = this.add
      .ellipse(PLAYER_START_X, GROUND_Y + 18, 112, 22, 0x160f0c, 0.27)
      .setDepth(28);
    this.player = this.add
      .sprite(PLAYER_START_X, GROUND_Y + 22, 'aspiring-actor', 0)
      .setOrigin(0.5, 1)
      .setScale(0.42)
      .setDepth(30);
  }

  private emitState(): void {
    const state: PlayState = {
      playerX: Math.round(this.player.x),
      discoveredCastingOffice: this.discoveredCastingOffice,
    };
    this.game.events.emit('play-state', state);
  }

  private applyMotionSettings(): void {
    for (const tween of this.atmosphericTweens) tween.paused = this.settings.reducedMotion;
  }

  private readonly restoreState = (state: PlayState): void => {
    const migratedX =
      state.playerX > WORLD_WIDTH
        ? Math.round((state.playerX / LEGACY_WORLD_WIDTH) * WORLD_WIDTH)
        : state.playerX;
    this.player.x = Phaser.Math.Clamp(migratedX, 110, WORLD_WIDTH - 110);
    this.playerShadow.x = this.player.x;
    this.discoveredCastingOffice = state.discoveredCastingOffice;
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.emitState();
  };

  private readonly onSettingsChanged = (settings: GameSettings): void => {
    this.settings = settings;
    this.applyMotionSettings();
  };
}
