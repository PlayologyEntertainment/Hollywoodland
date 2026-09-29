/** Every language the game can show. English is the source; the rest are translated from it and stay `beta` (labelled
 * so in the Settings picker) until a native reviewer signs the catalog off. See docs/LOCALIZATION_PLAN.md. */
export type LocaleStatus = 'source' | 'reviewed' | 'beta';

export interface LocaleInfo {
  readonly code: string;
  /** The language's own name, in its own script: never translated, so a player who cannot read the current language
   * can still find theirs. */
  readonly nativeName: string;
  readonly status: LocaleStatus;
  /** Whether a qualified reviewer has signed off this language's legal text (the Terms and Privacy Policy), which is tracked
   * apart from the rest. A language cannot be `reviewed` until this is true. English is the source, so it is true. */
  readonly legalReviewed: boolean;
}

export const SOURCE_LOCALE = 'en';

export const LOCALES: readonly LocaleInfo[] = Object.freeze([
  { code: 'en', nativeName: 'English', status: 'source', legalReviewed: true },
  { code: 'es', nativeName: 'Español', status: 'beta', legalReviewed: false },
  { code: 'fr', nativeName: 'Français', status: 'beta', legalReviewed: false },
  { code: 'de', nativeName: 'Deutsch', status: 'beta', legalReviewed: false },
  { code: 'pt-BR', nativeName: 'Português (Brasil)', status: 'beta', legalReviewed: false },
]);

/** Languages that exist only to test the engine, never offered to players (not in the picker, not accepted as a saved setting).
 * Reach one by adding `?lang=<code>` to the page address:
 *  - `en-XA` is English accented and stretched about 40 percent, generated from the current English (see pseudo.ts), for
 *    finding text that does not fit and fonts that cannot cope;
 *  - `ja` is a small sample of real Japanese (src/locales/ja.json), for checking Asian glyphs, wrapping and spacing. */
export const TEST_LOCALES: readonly string[] = Object.freeze(['en-XA', 'ja']);

/** The value of the language setting that follows the browser rather than naming a language. */
export const AUTO_LANGUAGE = 'auto';

/** A language the loader can fetch: a player language, or one of the test-only ones. */
export function isLoadableLocale(code: unknown): code is string {
  return isSupportedLocale(code) || (typeof code === 'string' && TEST_LOCALES.includes(code));
}

export function isSupportedLocale(code: unknown): code is string {
  return typeof code === 'string' && LOCALES.some((locale) => locale.code === code);
}

/** Turns the language setting into a supported locale code: a named language as-is, or, for `auto`, the first of the
 * browser's preferred languages that we have (an exact match, or the same base language: `pt-PT` and `pt` both give
 * `pt-BR`, `es-MX` gives `es`), otherwise English. */
export function resolveLocale(language: string, preferred: readonly string[]): string {
  if (isSupportedLocale(language)) return language;
  for (const tag of preferred) {
    const exact = LOCALES.find((locale) => locale.code.toLowerCase() === tag.toLowerCase());
    if (exact !== undefined) return exact.code;
    const base = tag.split('-')[0]?.toLowerCase();
    const sameBase = LOCALES.find((locale) => locale.code.split('-')[0]?.toLowerCase() === base);
    if (sameBase !== undefined) return sameBase.code;
  }
  return SOURCE_LOCALE;
}
