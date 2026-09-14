import './styles.css';

import { AppShell, type PlayState } from './app/AppShell';
import { SplashScreen } from './app/SplashScreen';
import { createGame } from './game/createGame';
import { InputController } from './input/InputController';
import { IndexedDbSaveRepository } from './save/IndexedDbSaveRepository';
import { parseSave, SAVE_SCHEMA_VERSION, serializeSave, type SaveEnvelope } from './save/SaveEnvelope';
import { BrowserSettingsRepository } from './settings/SettingsRepository';

const settingsRepository = new BrowserSettingsRepository(window.localStorage);
const saveRepository = new IndexedDbSaveRepository();
let settings = settingsRepository.load();
const input = new InputController(window);
let game: ReturnType<typeof createGame> | undefined;
let latestState: PlayState = { playerX: 620, discoveredCastingOffice: false };
let startedAt = performance.now();

/** Creates the Phaser game on first call — deferred until the player enters
 * play so the Main Menu shows the static concept art instead of live
 * gameplay — and reuses it on every later call (e.g. returning to the menu
 * and starting again). A state to restore is only meaningful on the first
 * call: it seeds the scene's initial create() directly, since there is no
 * already-booted scene yet to safely target with an event. */
function ensureGame(initialState?: PlayState): ReturnType<typeof createGame> {
  if (game === undefined) {
    game = createGame({ input, settings, ...(initialState !== undefined ? { initialState } : {}) });
    game.events.on('play-state', (state: PlayState) => { latestState = state; });
  }
  return game;
}

const makeSave = (): SaveEnvelope<PlayState> => ({
  schemaVersion: SAVE_SCHEMA_VERSION,
  contentVersion: 'phase-1-visual-spike',
  saveId: 'phase-1-manual',
  label: 'Hollywood Boulevard',
  savedAt: new Date().toISOString(),
  playtimeSeconds: Math.round((performance.now() - startedAt) / 1000),
  state: latestState,
});

const shell = new AppShell({
  settings,
  onSettingsChanged: (nextSettings) => {
    settings = nextSettings;
    settingsRepository.save(nextSettings);
    if (game !== undefined) {
      game.registry.set('settings', nextSettings);
      game.events.emit('settings-changed', nextSettings);
    }
  },
  onStart: (state) => {
    const isFirstStart = game === undefined;
    const activeGame = ensureGame(state);
    startedAt = performance.now();
    input.setGameplayActive(true);
    if (state !== undefined && !isFirstStart) activeGame.events.emit('restore-play-state', state);
    return activeGame;
  },
  onStop: () => input.setGameplayActive(false),
  onSave: async () => { await saveRepository.put(makeSave()); },
  onLoad: async () => {
    const save = await saveRepository.get('phase-1-manual');
    return save?.state as PlayState | undefined;
  },
  onExport: () => serializeSave(makeSave()),
  onImport: async (raw) => {
    const save = parseSave(raw) as SaveEnvelope<PlayState>;
    await saveRepository.put(save);
    return save.state;
  },
});

shell.mount();
void shell.refreshContinue();
new SplashScreen().mount();

window.addEventListener('beforeunload', () => {
  input.destroy();
  game?.destroy(true);
});
