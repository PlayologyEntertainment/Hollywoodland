import { AppShell } from './app/AppShell';
import { AudioDirector } from './audio/AudioDirector';
import { WebAudioEngine } from './audio/WebAudioEngine';
import { SplashScreen } from './app/SplashScreen';
import { NoOpAnalyticsClient, type AnalyticsEvent } from './analytics/Analytics';
import { createDefaultCareerState, type CareerState } from './domain/CareerState';
import { DomainEventBus } from './domain/DomainEventBus';
import { createGame } from './game/createGame';
import { InputController } from './input/InputController';
import { IndexedDbSaveRepository } from './save/IndexedDbSaveRepository';
import { migrateSaveEnvelope, parseSave, SAVE_SCHEMA_VERSION, serializeSave, type SaveEnvelope } from './save/SaveEnvelope';
import { BrowserSettingsRepository } from './settings/SettingsRepository';

const settingsRepository = new BrowserSettingsRepository(window.localStorage);
const saveRepository = new IndexedDbSaveRepository();
const domainEvents = new DomainEventBus();
let settings = settingsRepository.load();
const analytics = new NoOpAnalyticsClient();
const audio = new AudioDirector(new WebAudioEngine(import.meta.env.BASE_URL));
audio.setSettings(settings);
// Browsers only allow sound after the player has interacted with the page. Enter on the splash screen is the first
// interaction and starts the Main Menu music; this also covers a player who reaches the menus some other way.
for (const type of ['pointerdown', 'keydown'] as const) window.addEventListener(type, () => audio.unlock());
/** The player's analytics setting is the sole consent gate — no event ever
 * reaches the client (currently a no-op; see docs/PRODUCTION_ROADMAP.md
 * Phase 0) while they have it turned off. */
function track(event: AnalyticsEvent): void {
  if (settings.analyticsEnabled) analytics.track(event);
}
const input = new InputController(window);
let game: ReturnType<typeof createGame> | undefined;
let latestState: CareerState = createDefaultCareerState();
let startedAt = performance.now();
track({ name: 'session_started' });

/** Creates the Phaser game on first call — deferred until the player enters
 * play so the Main Menu shows the static concept art instead of live
 * gameplay — and reuses the same Phaser.Game on every later call (e.g.
 * returning to the menu and starting again), rather than tearing down and
 * recreating the whole engine.
 *
 * Every call past the first re-runs BoulevardBootScene from scratch (see
 * that scene for why it's safe to run more than once), rather than just
 * poking the already-running BoulevardSpikeScene with a
 * 'restore-career-state' event — otherwise a manifest edit made through
 * the Art Director tool while this tab stayed open would never take
 * effect without a full page reload, since the tab's first boot is the
 * only time the manifest would ever get fetched. Seeding
 * `initialCareerState` in the registry before restarting reuses the exact
 * same restore path the scene's own create() already has for its first
 * boot, so there's one code path for "start with this state" rather than
 * a special case per call site. */
function ensureGame(initialState?: CareerState): ReturnType<typeof createGame> {
  if (game === undefined) {
    game = createGame({ input, settings, domainEvents, ...(initialState !== undefined ? { initialState } : {}) });
    domainEvents.on('career-state-changed', (state) => { latestState = state; });
  } else {
    if (initialState !== undefined) game.registry.set('initialCareerState', initialState);
    else game.registry.remove('initialCareerState');
    game.scene.stop('BoulevardSpikeScene');
    game.scene.start('BoulevardBootScene');
  }
  return game;
}

const makeSave = (): SaveEnvelope<CareerState> => ({
  schemaVersion: SAVE_SCHEMA_VERSION,
  contentVersion: 'phase-2-core-systems',
  saveId: 'phase-1-manual',
  label: 'Hollywood Boulevard',
  savedAt: new Date().toISOString(),
  playtimeSeconds: Math.round((performance.now() - startedAt) / 1000),
  state: latestState,
});

const shell = new AppShell({
  settings,
  audio,
  domainEvents,
  onSettingsChanged: (nextSettings) => {
    settings = nextSettings;
    settingsRepository.save(nextSettings);
    audio.setSettings(nextSettings);
    track({ name: 'settings_changed' });
    if (game !== undefined) {
      game.registry.set('settings', nextSettings);
      domainEvents.emit('settings-changed', nextSettings);
    }
  },
  onStart: (state) => {
    const isFirstStart = game === undefined;
    const activeGame = ensureGame(state);
    startedAt = performance.now();
    input.setGameplayActive(true);
    if (isFirstStart) track({ name: 'foundation_entered' });
    return activeGame;
  },
  onStop: () => input.setGameplayActive(false),
  onSave: async () => { await saveRepository.put(makeSave()); },
  onLoad: async () => {
    const save = await saveRepository.get('phase-1-manual');
    return save === undefined ? undefined : migrateSaveEnvelope(save).state;
  },
  onExport: () => serializeSave(makeSave()),
  onImport: async (raw) => {
    const save = parseSave(raw);
    await saveRepository.put(save);
    return save.state;
  },
});

shell.mount();
void shell.refreshContinue();
new SplashScreen().mount(() => {
  audio.unlock();
  audio.setMood('menu');
});

window.addEventListener('beforeunload', () => {
  input.destroy();
  game?.destroy(true);
});
