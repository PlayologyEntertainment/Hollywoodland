import Phaser from 'phaser';

import type { InputController } from '../../input/InputController';
import type { GameSettings } from '../../settings/Settings';

const WORLD_WIDTH = 3600;
const GROUND_Y = 865;
const WALK_SPEED = 430;

export class BoulevardFoundationScene extends Phaser.Scene {
  private inputController!: InputController;
  private player!: Phaser.GameObjects.Container;
  private farLayer!: Phaser.GameObjects.Container;
  private midLayer!: Phaser.GameObjects.Container;
  private settings!: GameSettings;

  public constructor() {
    super('BoulevardFoundationScene');
  }

  public create(): void {
    this.inputController = this.registry.get('inputController') as InputController;
    this.settings = this.registry.get('settings') as GameSettings;
    this.drawFoundationScene();
    this.player = this.createPlayer(960, GROUND_Y);

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 1080);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setDeadzone(560, 320);

    this.game.events.on('settings-changed', this.onSettingsChanged, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('settings-changed', this.onSettingsChanged, this);
    });
  }

  public override update(_time: number, delta: number): void {
    const direction = Number(this.inputController.isDown('moveRight')) -
      Number(this.inputController.isDown('moveLeft'));
    const movement = direction * WALK_SPEED * (delta / 1000);
    this.player.x = Phaser.Math.Clamp(this.player.x + movement, 120, WORLD_WIDTH - 120);
    if (direction !== 0) this.player.scaleX = direction;

    const cameraX = this.cameras.main.scrollX;
    const motionScale = this.settings.reducedMotion ? 0 : 1;
    this.farLayer.x = cameraX * 0.78 * motionScale;
    this.midLayer.x = cameraX * 0.42 * motionScale;
  }

  private drawFoundationScene(): void {
    const background = this.add.graphics();
    background.fillStyle(0x4f2621).fillRect(0, 0, WORLD_WIDTH, 1080);
    background.fillStyle(0xd07a45).fillRect(0, 360, WORLD_WIDTH, 720);
    background.fillStyle(0xefbd78).fillCircle(1520, 250, 145);

    this.farLayer = this.add.container();
    for (let x = 0; x < WORLD_WIDTH + 500; x += 260) {
      const height = 180 + ((x / 260) % 4) * 45;
      const building = this.add.rectangle(x, 520 - height / 2, 220, height, 0x6f4032);
      building.setOrigin(0, 0);
      this.farLayer.add(building);
    }

    this.midLayer = this.add.container();
    for (let x = 0; x < WORLD_WIDTH; x += 480) {
      const facade = this.add.rectangle(x, 570, 430, 410, x % 960 === 0 ? 0x2f5161 : 0x6d3030);
      facade.setOrigin(0, 0);
      const marquee = this.add.rectangle(x + 215, 675, 260, 72, 0xe0ad55).setStrokeStyle(8, 0x3b2114);
      const doors = this.add.rectangle(x + 215, 865, 150, 240, 0x1a1615).setOrigin(0.5, 1);
      this.midLayer.add([facade, marquee, doors]);
    }

    const street = this.add.graphics();
    street.fillStyle(0x3c3430).fillRect(0, GROUND_Y, WORLD_WIDTH, 215);
    street.lineStyle(12, 0xe5c274, 0.55).lineBetween(0, 1030, WORLD_WIDTH, 1030);

    this.add
      .text(960, 120, 'HOLLYWOOD BOULEVARD · FOUNDATION SCENE', {
        color: '#2a160e',
        fontFamily: 'Georgia, serif',
        fontSize: '42px',
        letterSpacing: 8,
      })
      .setOrigin(0.5)
      .setScrollFactor(0.1);
  }

  private createPlayer(x: number, y: number): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 0, 120, 28, 0x000000, 0.3);
    const body = this.add.rectangle(0, -105, 70, 170, 0x211c1a).setStrokeStyle(5, 0xf0cf8e);
    const head = this.add.circle(0, -220, 52, 0xe4a46e).setStrokeStyle(5, 0x3b2114);
    const hat = this.add.rectangle(0, -275, 130, 24, 0x2a211d);
    return this.add.container(x, y, [shadow, body, head, hat]);
  }

  private readonly onSettingsChanged = (settings: GameSettings): void => {
    this.settings = settings;
  };
}
