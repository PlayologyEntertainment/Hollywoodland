import './styles.css';

import { AppShell, type PlayState } from './app/AppShell';
import { createGame } from './game/createGame';
import { InputController } from './input/InputController';
import { IndexedDbSaveRepository } from './save/IndexedDbSaveRepository';
import { parseSave, SAVE_SCHEMA_VERSION, serializeSave, type SaveEnvelope } from './save/SaveEnvelope';
import { BrowserSettingsRepository } from './settings/SettingsRepository';

const settingsRepository = new BrowserSettingsRepository(window.localStorage);
const saveRepository = new IndexedDbSaveRepository();
const settings = settingsRepository.load();
const input = new InputController(window);
const game = createGame({ input, settings });
let latestState: PlayState = { playerX: 620, discoveredCastingOffice: false };
let startedAt = performance.now();

game.events.on('play-state', (state: PlayState) => { latestState = state; });

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
  game,
  onSettingsChanged: (nextSettings) => {
    settingsRepository.save(nextSettings);
    game.registry.set('settings', nextSettings);
    game.events.emit('settings-changed', nextSettings);
  },
  onStart: (state) => {
    startedAt = performance.now();
    input.setGameplayActive(true);
    if (state !== undefined) game.events.emit('restore-play-state', state);
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

window.addEventListener('beforeunload', () => {
  input.destroy();
  game.destroy(true);
});
