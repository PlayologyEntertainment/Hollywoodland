import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS, normalizeSettings } from '../src/settings/Settings';
import { BrowserSettingsRepository, type StorageLike } from '../src/settings/SettingsRepository';

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();
  public getItem(key: string): string | null { return this.values.get(key) ?? null; }
  public setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('settings', () => {
  it('uses safe defaults for unknown input', () => { expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS); });
  it('clamps text scale and defaults new visual settings', () => {
    expect(normalizeSettings({ textScale: 9, filmEffects: 'yes' })).toEqual({ ...DEFAULT_SETTINGS, textScale: 1.5 });
  });
  it('defaults the language to automatic and keeps only known languages', () => {
    expect(DEFAULT_SETTINGS.language).toBe('auto');
    expect(normalizeSettings({ language: 'pt-BR' }).language).toBe('pt-BR');
    expect(normalizeSettings({ language: 'klingon' }).language).toBe('auto');
    expect(normalizeSettings({ language: 7 }).language).toBe('auto');
  });
  it('round-trips settings through storage', () => {
    const repository = new BrowserSettingsRepository(new MemoryStorage());
    repository.save({ ...DEFAULT_SETTINGS, reducedMotion: true, filmEffects: false });
    expect(repository.load()).toEqual({ ...DEFAULT_SETTINGS, reducedMotion: true, filmEffects: false });
  });
});
