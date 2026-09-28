import { formatMessage, type MessageParams } from './message';
import { SOURCE_LOCALE, isSupportedLocale } from './locales';

/** A locale's strings, by key. */
export type Catalog = Readonly<Record<string, string>>;

/** Fetches one locale's catalog. Real loading is lazy (see main.ts), so only the language in use is downloaded. */
export type CatalogLoader = (locale: string) => Promise<Catalog>;

type LocaleListener = (locale: string) => void;

/** Looks up display text for the active language.
 *
 * `t(key, params, fallback)` tries the active locale, then English, then the caller's own inline `fallback` (the English
 * that authored content carries beside its ids), and finally the key itself, so a missing translation shows English
 * rather than breaking anything. English is loaded up front; other locales load when chosen. Engine-independent: no DOM,
 * no Phaser, so domain code and tests can use it directly. */
export class I18n {
  private active: Catalog = {};
  private source: Catalog = {};
  private current = SOURCE_LOCALE;
  private readonly listeners = new Set<LocaleListener>();
  private requestId = 0;

  public constructor(private readonly loader: CatalogLoader) {}

  public get locale(): string {
    return this.current;
  }

  /** Loads English so lookups work before any other language is chosen. Call once at startup. */
  public async init(): Promise<void> {
    this.source = await this.loader(SOURCE_LOCALE);
    if (this.current === SOURCE_LOCALE) this.active = this.source;
  }

  /** Switches language and tells listeners once the new catalog is in place. An unsupported code is ignored. A catalog
   * that fails to load leaves the game in English rather than half-translated. If the player changes their mind while a
   * catalog is still loading, the later choice wins. */
  public async setLocale(locale: string): Promise<void> {
    if (!isSupportedLocale(locale)) return;
    const request = ++this.requestId;
    let chosen = locale;
    let catalog: Catalog = this.source;
    if (locale !== SOURCE_LOCALE) {
      try {
        catalog = await this.loader(locale);
      } catch {
        chosen = SOURCE_LOCALE;
      }
    }
    if (request !== this.requestId) return;
    this.current = chosen;
    this.active = catalog;
    for (const listener of this.listeners) listener(chosen);
  }

  public t(key: string, params?: MessageParams, fallback?: string): string {
    const template = this.active[key] ?? this.source[key] ?? fallback ?? key;
    return formatMessage(template, params, this.current);
  }

  /** Whether the active language (not just English) has a string for `key`. */
  public has(key: string): boolean {
    return this.active[key] !== undefined;
  }

  public onChange(listener: LocaleListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
