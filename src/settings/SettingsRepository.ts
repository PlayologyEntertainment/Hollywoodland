import { DEFAULT_SETTINGS, normalizeSettings, type GameSettings } from './Settings';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const SETTINGS_KEY = 'hollywoodland.settings.v1';

export class BrowserSettingsRepository {
  public constructor(private readonly storage: StorageLike) {}
  public load(): GameSettings {
    try {
      const raw = this.storage.getItem(SETTINGS_KEY);
      return raw === null ? DEFAULT_SETTINGS : normalizeSettings(JSON.parse(raw));
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  public save(settings: GameSettings): void {
    this.storage.setItem(SETTINGS_KEY, JSON.stringify(normalizeSettings(settings)));
  }
}
