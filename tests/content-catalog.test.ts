// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync, writeFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { collectContentStrings } from '../src/i18n/contentStrings';

const catalogUrl = new URL('../src/locales/en.json', import.meta.url);

/** The catalog with its `content.*` entries replaced by what the authored content says right now. Interface keys are kept. */
function syncedCatalog(): Record<string, string> {
  const current = JSON.parse(readFileSync(catalogUrl, 'utf8') as string) as Record<string, string>;
  const interfaceKeys = Object.entries(current).filter(([key]) => !key.startsWith('content.'));
  return Object.fromEntries([...interfaceKeys, ...Object.entries(collectContentStrings())]);
}

describe('the English content catalog', () => {
  // `npm run i18n:sync` sets I18N_SYNC=1, which rewrites the catalog from the content instead of checking it.
  const sync = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.['I18N_SYNC'] === '1';

  it(sync ? 'is rewritten from the authored content' : 'matches the authored content (run `npm run i18n:sync` after editing content text)', () => {
    const wanted = syncedCatalog();
    if (sync) writeFileSync(catalogUrl, `${JSON.stringify(wanted, null, 2)}\n`);
    const actual = JSON.parse(readFileSync(catalogUrl, 'utf8') as string) as Record<string, string>;
    expect(actual).toEqual(wanted);
  });

  it('covers a meaningful amount of content, so an empty walk cannot pass', () => {
    const strings = collectContentStrings();
    const keys = Object.keys(strings);
    expect(keys.filter((key) => key.startsWith('content.dialogue.')).length).toBeGreaterThan(100);
    for (const prefix of ['quest', 'talent', 'item', 'assignment', 'character', 'housing', 'origin', 'player', 'audition', 'location', 'sceneArt']) {
      expect(keys.some((key) => key.startsWith(`content.${prefix}.`)), prefix).toBe(true);
    }
    for (const [key, text] of Object.entries(strings)) expect(text.trim(), key).not.toBe('');
  });
});
