import Phaser from 'phaser';

import type { InputController } from '../input/InputController';
import type { GameSettings } from '../settings/Settings';
import { BoulevardSpikeScene } from './scenes/BoulevardSpikeScene';

interface CreateGameOptions {
  readonly input: InputController;
  readonly settings: GameSettings;
}

export function createGame(options: CreateGameOptions): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-root',
    width: 1920,
    height: 1080,
    backgroundColor: '#160f16',
    antialias: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [BoulevardSpikeScene],
  });
  game.registry.set('inputController', options.input);
  game.registry.set('settings', options.settings);
  return game;
}
