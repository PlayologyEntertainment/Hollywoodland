import Phaser from 'phaser';

import type { PlayState } from '../../app/AppShell';
import type { InputController } from '../../input/InputController';
import type { GameSettings } from '../../settings/Settings';

const WORLD_WIDTH = 5600;
const GROUND_Y = 872;
const WALK_SPEED = 445;
const CASTING_OFFICE_X = 3560;

interface Storefront {
  readonly x: number;
  readonly width: number;
  readonly height: number;
  readonly color: number;
  readonly trim: number;
  readonly name: string;
}

export class BoulevardSpikeScene extends Phaser.Scene {
  private inputController!: InputController;
  private settings!: GameSettings;
  private player!: Phaser.GameObjects.Sprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;
  private promptVisible = false;
  private discoveredCastingOffice = false;
  private stateClock = 0;

  public constructor() {
    super('BoulevardSpikeScene');
  }

  public preload(): void {
    this.load.spritesheet('aspiring-actor', `${import.meta.env.BASE_URL}assets/characters/aspiring-actor-walk.webp`, {
      frameWidth: 384,
      frameHeight: 512,
    });
  }

  public create(): void {
    this.inputController = this.registry.get('inputController') as InputController;
    this.settings = this.registry.get('settings') as GameSettings;
    this.cameras.main.setBackgroundColor('#1b1017');
    this.drawSky();
    this.drawDistantHollywood();
    this.drawBoulevard();
    this.drawForeground();
    this.createPlayer();

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 1080);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    this.cameras.main.setDeadzone(560, 300);

    this.game.events.on('settings-changed', this.onSettingsChanged, this);
    this.game.events.on('restore-play-state', this.restoreState, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('settings-changed', this.onSettingsChanged, this);
      this.game.events.off('restore-play-state', this.restoreState, this);
    });
    this.emitState();
  }

  public override update(_time: number, delta: number): void {
    this.player.anims.timeScale = this.settings.reducedMotion ? 0.78 : 1;
    const direction = Number(this.inputController.isDown('moveRight')) - Number(this.inputController.isDown('moveLeft'));
    this.player.x = Phaser.Math.Clamp(this.player.x + direction * WALK_SPEED * (delta / 1000), 160, WORLD_WIDTH - 160);
    this.playerShadow.x = this.player.x;

    if (direction !== 0) {
      this.player.setFlipX(direction < 0);
      if (!this.player.anims.isPlaying) this.player.play('actor-walk');
    } else {
      this.player.stop();
      this.player.setFrame(0);
    }

    const nearCasting = Math.abs(this.player.x - CASTING_OFFICE_X) < 235;
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

  private drawSky(): void {
    const sky = this.add.graphics().setScrollFactor(0);
    sky.fillGradientStyle(0x321a35, 0x321a35, 0xe88757, 0xf6c47e, 1);
    sky.fillRect(0, 0, 1920, 875);
    sky.fillStyle(0xffd99b, 0.82).fillCircle(1500, 230, 115);
    for (let index = 0; index < 18; index += 1) {
      const x = 90 + index * 121;
      const y = 110 + (index % 4) * 32;
      sky.fillStyle(0xffe8bd, 0.16).fillEllipse(x, y, 190, 34);
    }
  }

  private drawDistantHollywood(): void {
    const hills = this.add.graphics().setScrollFactor(0.08);
    hills.fillStyle(0x3a3037, 0.96);
    hills.beginPath().moveTo(-400, 595);
    for (let x = -400; x <= WORLD_WIDTH + 400; x += 260) {
      hills.lineTo(x, 430 - ((x / 260) % 3) * 48);
    }
    hills.lineTo(WORLD_WIDTH + 400, 720).lineTo(-400, 720).closePath().fillPath();

    this.add.text(1250, 388, 'HOLLYWOODLAND', {
      color: '#f3ead5', fontFamily: 'Arial, sans-serif', fontSize: '56px', fontStyle: 'bold', letterSpacing: 10,
    }).setScrollFactor(0.08).setRotation(-0.035).setAlpha(0.78);

    const skyline = this.add.graphics().setScrollFactor(0.18);
    for (let x = -200; x < WORLD_WIDTH + 400; x += 170) {
      const height = 105 + ((x / 170 + 5) % 5) * 26;
      skyline.fillStyle(x % 340 === 0 ? 0x4e3943 : 0x493a41, 0.98).fillRect(x, 650 - height, 145, height);
      for (let row = 0; row < 3; row += 1) {
        skyline.fillStyle(0xf5c574, 0.34).fillRect(x + 24, 570 - row * 32, 18, 12);
        skyline.fillRect(x + 70, 570 - row * 32, 18, 12);
      }
    }
  }

  private drawBoulevard(): void {
    const sidewalk = this.add.graphics();
    sidewalk.fillStyle(0xb99b78).fillRect(0, GROUND_Y - 45, WORLD_WIDTH, 150);
    sidewalk.lineStyle(3, 0x6f5949, 0.5);
    for (let x = 0; x < WORLD_WIDTH; x += 160) sidewalk.lineBetween(x, GROUND_Y - 45, x + 80, GROUND_Y + 105);

    const stores: readonly Storefront[] = [
      { x: 0, width: 720, height: 390, color: 0x7d3841, trim: 0xe3ba72, name: 'PALM COURT HOTEL' },
      { x: 720, width: 660, height: 330, color: 0x31566a, trim: 0xe5c175, name: 'GOLDEN CUP DINER' },
      { x: 1380, width: 820, height: 470, color: 0x6b3b54, trim: 0xe7c686, name: 'ORPHEUM PICTURES' },
      { x: 2200, width: 650, height: 350, color: 0x426057, trim: 0xd9b878, name: 'MARLOWE TAILOR' },
      { x: 2850, width: 1020, height: 430, color: 0x783a35, trim: 0xf1c866, name: 'SUNSET CASTING EXCHANGE' },
      { x: 3870, width: 700, height: 365, color: 0x3a546c, trim: 0xd9b36c, name: 'THE SILVER SPOON' },
      { x: 4570, width: 1030, height: 450, color: 0x5e384f, trim: 0xe8c984, name: 'EGYPTIAN THEATRE' },
    ];

    for (const store of stores) this.drawStorefront(store);
    this.drawStreetLights();
    this.drawPeriodCars();

    const road = this.add.graphics();
    road.fillStyle(0x302d31).fillRect(0, GROUND_Y + 105, WORLD_WIDTH, 103);
    road.lineStyle(7, 0xd8b970, 0.45).lineBetween(0, 1050, WORLD_WIDTH, 1050);
  }

  private drawStorefront(store: Storefront): void {
    const top = GROUND_Y - 45 - store.height;
    const building = this.add.graphics();
    building.fillStyle(store.color).fillRect(store.x, top, store.width, store.height);
    building.fillStyle(0x18151a, 0.75).fillRect(store.x + 30, GROUND_Y - 250, store.width - 60, 205);
    building.lineStyle(8, store.trim, 0.85).strokeRect(store.x + 22, GROUND_Y - 258, store.width - 44, 213);

    for (let x = store.x + 75; x < store.x + store.width - 60; x += 125) {
      building.fillStyle(0xf6c777, 0.54).fillRect(x, top + 70, 62, 80);
      building.lineStyle(4, 0x251c22, 0.8).strokeRect(x, top + 70, 62, 80);
    }
    building.fillStyle(store.trim).fillRect(store.x + 50, top + store.height * 0.48, store.width - 100, 82);
    building.lineStyle(6, 0x382119).strokeRect(store.x + 50, top + store.height * 0.48, store.width - 100, 82);
    this.add.text(store.x + store.width / 2, top + store.height * 0.48 + 41, store.name, {
      color: '#2b1b18', fontFamily: 'Georgia, serif', fontSize: store.width > 800 ? '32px' : '25px', fontStyle: 'bold', letterSpacing: 3,
    }).setOrigin(0.5);

    const doorX = store.name.includes('CASTING') ? CASTING_OFFICE_X : store.x + store.width / 2;
    building.fillStyle(0x151117).fillRect(doorX - 58, GROUND_Y - 223, 116, 178);
    building.lineStyle(7, store.trim, 0.9).strokeRect(doorX - 58, GROUND_Y - 223, 116, 178);
    if (store.name.includes('CASTING')) {
      building.fillStyle(0xf7db8a, 0.8).fillCircle(doorX + 34, GROUND_Y - 132, 8);
      this.add.rectangle(doorX, GROUND_Y - 270, 300, 24, 0xffdc75, 0.24).setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  private drawStreetLights(): void {
    for (let x = 360; x < WORLD_WIDTH; x += 720) {
      const lamp = this.add.graphics();
      lamp.fillStyle(0x1b1720).fillRect(x - 9, 575, 18, 290);
      lamp.fillCircle(x, 565, 52);
      lamp.fillStyle(0xffd990, 0.9).fillCircle(x, 565, 34);
      this.add.circle(x, 565, 94, 0xffc668, 0.1).setBlendMode(Phaser.BlendModes.ADD);
    }
  }

  private drawPeriodCars(): void {
    const cars = [1030, 2460, 4290, 5070];
    cars.forEach((x, index) => {
      const car = this.add.container(x, 925);
      const color = [0x1f4352, 0x6c3034, 0x2f513e, 0x4a3a63][index] ?? 0x333333;
      const body = this.add.rectangle(0, 0, 260, 78, color).setStrokeStyle(7, 0x17141a);
      const cabin = this.add.triangle(0, -65, -90, 65, -45, 0, 90, 65, color).setStrokeStyle(7, 0x17141a);
      const front = this.add.circle(90, 43, 35, 0x111116).setStrokeStyle(9, 0xb28b54);
      const back = this.add.circle(-88, 43, 35, 0x111116).setStrokeStyle(9, 0xb28b54);
      car.add([body, cabin, front, back]);
    });
  }

  private drawForeground(): void {
    for (let x = 180; x < WORLD_WIDTH; x += 860) {
      const palm = this.add.graphics().setDepth(20);
      palm.fillStyle(0x24191c).fillRect(x - 14, 535, 28, 395);
      for (let angle = -2.8; angle < 0.2; angle += 0.42) {
        palm.lineStyle(30, 0x18251f, 1).lineBetween(x, 535, x + Math.cos(angle) * 150, 535 + Math.sin(angle) * 95);
      }
    }
    const vignette = this.add.graphics().setScrollFactor(0).setDepth(50);
    vignette.lineStyle(110, 0x170e16, 0.18).strokeRect(-35, -35, 1990, 1150);
  }

  private createPlayer(): void {
    this.anims.create({ key: 'actor-walk', frames: this.anims.generateFrameNumbers('aspiring-actor', { start: 0, end: 7 }), frameRate: 11, repeat: -1 });
    this.playerShadow = this.add.ellipse(620, GROUND_Y + 30, 150, 30, 0x000000, 0.28).setDepth(29);
    this.player = this.add.sprite(620, GROUND_Y + 34, 'aspiring-actor', 0).setOrigin(0.5, 1).setScale(0.62).setDepth(30);
  }

  private emitState(): void {
    const state: PlayState = { playerX: Math.round(this.player.x), discoveredCastingOffice: this.discoveredCastingOffice };
    this.game.events.emit('play-state', state);
  }

  private readonly restoreState = (state: PlayState): void => {
    this.player.x = Phaser.Math.Clamp(state.playerX, 160, WORLD_WIDTH - 160);
    this.playerShadow.x = this.player.x;
    this.discoveredCastingOffice = state.discoveredCastingOffice;
    this.cameras.main.centerOn(this.player.x, this.player.y);
    this.emitState();
  };

  private readonly onSettingsChanged = (settings: GameSettings): void => { this.settings = settings; };
}
