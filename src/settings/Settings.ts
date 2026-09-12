export interface GameSettings {
  readonly textScale: number;
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly analyticsEnabled: boolean;
  readonly filmEffects: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = Object.freeze({
  textScale: 1,
  highContrast: false,
  reducedMotion: false,
  analyticsEnabled: true,
  filmEffects: true,
});

export function normalizeSettings(value: unknown): GameSettings {
  if (!isRecord(value)) return DEFAULT_SETTINGS;
  return {
    textScale: clampNumber(value.textScale, 1, 1.5, DEFAULT_SETTINGS.textScale),
    highContrast: readBoolean(value.highContrast, DEFAULT_SETTINGS.highContrast),
    reducedMotion: readBoolean(value.reducedMotion, DEFAULT_SETTINGS.reducedMotion),
    analyticsEnabled: readBoolean(value.analyticsEnabled, DEFAULT_SETTINGS.analyticsEnabled),
    filmEffects: readBoolean(value.filmEffects, DEFAULT_SETTINGS.filmEffects),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}
