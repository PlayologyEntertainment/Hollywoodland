import Phaser from 'phaser';

import type { CareerState } from '../domain/CareerState';
import type { DomainEventBus } from '../domain/DomainEventBus';
import type { InputController } from '../input/InputController';
import type { GameSettings } from '../settings/Settings';
import { BoulevardBootScene } from './scenes/BoulevardBootScene';
import { BoulevardSpikeScene } from './scenes/BoulevardSpikeScene';

interface CreateGameOptions {
  readonly input: InputController;
  readonly settings: GameSettings;
  readonly domainEvents: DomainEventBus;
  /** Applied directly during the scene's create() — since the game is
   * created lazily on first entry, there is no already-booted scene to
   * safely target with the 'restore-career-state' event yet. */
  readonly initialState?: CareerState;
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
    // Centred side to side only: the picture always sits flush under the header, and any spare height is left below it.
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
    scene: [BoulevardBootScene, BoulevardSpikeScene],
  });
  game.registry.set('inputController', options.input);
  game.registry.set('settings', options.settings);
  game.registry.set('domainEvents', options.domainEvents);
  if (options.initialState !== undefined) game.registry.set('initialCareerState', options.initialState);
  return game;
}
