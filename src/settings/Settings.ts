export interface GameSettings {
  readonly textScale: number;
  readonly highContrast: boolean;
  readonly reducedMotion: boolean;
  readonly analyticsEnabled: boolean;
  readonly filmEffects: boolean;
  /** 0 to 1, shaped to a gain by sliderToGain. Music covers the Main Menu, Character Creator, Boulevard and building tracks. */
  readonly musicVolume: number;
  readonly musicMuted: boolean;
  /** The street ambience that plays under the Boulevard music. */
  readonly ambienceVolume: number;
  readonly ambienceMuted: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = Object.freeze({
  textScale: 1,
  highContrast: false,
  reducedMotion: false,
  analyticsEnabled: true,
  filmEffects: true,
  musicVolume: 0.6,
  musicMuted: false,
  ambienceVolume: 0.5,
  ambienceMuted: false,
});

export function normalizeSettings(value: unknown): GameSettings {
  if (!isRecord(value)) return DEFAULT_SETTINGS;
  return {
    textScale: clampNumber(value.textScale, 1, 1.5, DEFAULT_SETTINGS.textScale),
    highContrast: readBoolean(value.highContrast, DEFAULT_SETTINGS.highContrast),
    reducedMotion: readBoolean(value.reducedMotion, DEFAULT_SETTINGS.reducedMotion),
    analyticsEnabled: readBoolean(value.analyticsEnabled, DEFAULT_SETTINGS.analyticsEnabled),
    filmEffects: readBoolean(value.filmEffects, DEFAULT_SETTINGS.filmEffects),
    musicVolume: clampNumber(value.musicVolume, 0, 1, DEFAULT_SETTINGS.musicVolume),
    musicMuted: readBoolean(value.musicMuted, DEFAULT_SETTINGS.musicMuted),
    ambienceVolume: clampNumber(value.ambienceVolume, 0, 1, DEFAULT_SETTINGS.ambienceVolume),
    ambienceMuted: readBoolean(value.ambienceMuted, DEFAULT_SETTINGS.ambienceMuted),
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
