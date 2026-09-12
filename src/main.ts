import './styles.css';

import { AppShell } from './app/AppShell';
import { createGame } from './game/createGame';
import { InputController } from './input/InputController';
import { BrowserSettingsRepository } from './settings/SettingsRepository';

const settingsRepository = new BrowserSettingsRepository(window.localStorage);
const settings = settingsRepository.load();
const input = new InputController(window);
const game = createGame({ input, settings });

const shell = new AppShell({
  settings,
  onSettingsChanged: (nextSettings) => {
    settingsRepository.save(nextSettings);
    game.registry.set('settings', nextSettings);
    game.events.emit('settings-changed', nextSettings);
  },
  onStart: () => input.setGameplayActive(true),
  onStop: () => input.setGameplayActive(false),
});

shell.mount();

window.addEventListener('beforeunload', () => {
  input.destroy();
  game.destroy(true);
});
