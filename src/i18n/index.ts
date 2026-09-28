import en from '../locales/en.json';
import { I18n, type Catalog } from './I18n';
import type { MessageParams } from './message';

// English is bundled with the game, so text exists from the first paint. Every other language is its own chunk, fetched
// only when the player picks it (or Automatic resolves to it).
const catalogLoaders = import.meta.glob<Catalog>('../locales/*.json', { import: 'default' });

/** The game's one translator. UI code calls `t(...)`; only the shell (main.ts) changes its language. */
export const i18n = new I18n((locale) => {
  const load = catalogLoaders[`../locales/${locale}.json`];
  return load === undefined ? Promise.reject(new Error(`No catalog for ${locale}`)) : load();
}, en as Catalog);

/** Display text for `key` in the active language. Params fill `{name}` and plural placeholders; see message.ts. */
export function t(key: string, params?: MessageParams): string {
  return i18n.t(key, params);
}
