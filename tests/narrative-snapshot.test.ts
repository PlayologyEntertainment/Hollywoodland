// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { buildNarrativeSnapshot, summarize, type LocaleInputs } from '../src/content/NarrativeSnapshot';
import { collectContentStrings } from '../src/i18n/contentStrings';
import { LOCALES, SOURCE_LOCALE } from '../src/i18n/locales';

const localesDir = new URL('../src/locales/', import.meta.url);
const snapshotUrl = new URL('../tools/story-planner/data/narrative-snapshot.json', import.meta.url);

const readJson = <T,>(url: URL): T => JSON.parse(readFileSync(url, 'utf8') as string) as T;

function localeInputs(): LocaleInputs {
  const catalogs: Record<string, Record<string, string>> = {};
  const hashes: Record<string, Record<string, string>> = {};
  for (const info of LOCALES.filter((locale) => locale.code !== SOURCE_LOCALE)) {
    catalogs[info.code] = readJson<Record<string, string>>(new URL(`${info.code}.json`, localesDir));
    const metaUrl = new URL(`meta/${info.code}.json`, localesDir);
    hashes[info.code] = existsSync(metaUrl) ? (readJson<{ hashes?: Record<string, string> }>(metaUrl).hashes ?? {}) : {};
  }
  return { catalogs, hashes };
}

/** The Story Planner (tools/story-planner, which is not part of the shipped build) reads this snapshot of everything the game has written. */
describe('the narrative snapshot for the Story Planner', () => {
  // `npm run narrative:export` sets NARRATIVE_EXPORT=1, which rewrites the snapshot instead of checking it.
  const write = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.['NARRATIVE_EXPORT'] === '1';

  it(write ? 'is rewritten from the authored content' : 'is current (run `npm run narrative:export` after changing content or translations)', () => {
    const wanted = buildNarrativeSnapshot(localeInputs());
    if (write) writeFileSync(snapshotUrl, `${JSON.stringify(wanted, null, 1)}\n`);
    expect(readJson<unknown>(snapshotUrl)).toEqual(JSON.parse(JSON.stringify(wanted)));
  });

  it('gives every authored string, the English text, and how each translation stands', () => {
    const snapshot = buildNarrativeSnapshot(localeInputs()) as { strings: Record<string, { en: string; tr: Record<string, string> }> };
    const english = collectContentStrings();
    expect(Object.keys(snapshot.strings).sort()).toEqual(Object.keys(english).sort());
    for (const [key, entry] of Object.entries(snapshot.strings)) {
      expect(entry.en, key).toBe(english[key]);
      expect(Object.keys(entry.tr).sort(), key).toEqual(LOCALES.filter((info) => info.code !== SOURCE_LOCALE).map((info) => info.code).sort());
    }
  });

  it('refers to text only by keys that exist in the catalog', () => {
    const snapshot = buildNarrativeSnapshot(localeInputs()) as {
      strings: Record<string, unknown>;
      dialogue: Array<{ nodes: Array<{ speaker: string; text: string; choices: Array<{ label: string }> }> }>;
      quests: Array<{ title: string; summary: string; stages: Array<{ text: string }> }>;
    };
    for (const graph of snapshot.dialogue) {
      for (const node of graph.nodes) {
        expect(snapshot.strings[node.speaker], node.speaker).toBeDefined();
        expect(snapshot.strings[node.text], node.text).toBeDefined();
        for (const choice of node.choices) expect(snapshot.strings[choice.label], choice.label).toBeDefined();
      }
    }
    for (const quest of snapshot.quests) {
      for (const key of [quest.title, quest.summary, ...quest.stages.map((stage) => stage.text)]) expect(snapshot.strings[key], key).toBeDefined();
    }
  });

  it('marks a translation stale when its English has changed, and missing when it is absent', () => {
    const inputs = localeInputs();
    const key = 'content.assignment.scene-study-class.title';
    const catalogs: Record<string, Record<string, string>> = { ...inputs.catalogs, es: { ...inputs.catalogs['es'], [key]: 'Clase' } };
    const hashes: Record<string, Record<string, string>> = { ...inputs.hashes, es: { ...inputs.hashes['es'], [key]: '00000000' } };
    const partial: Record<string, Record<string, string>> = {
      ...catalogs,
      fr: Object.fromEntries(Object.entries(catalogs['fr'] ?? {}).filter(([name]) => name !== key)) as Record<string, string>,
    };
    const snapshot = buildNarrativeSnapshot({ catalogs: partial, hashes }) as { strings: Record<string, { tr: Record<string, string> }> };
    expect(snapshot.strings[key]?.tr['es']).toBe('stale');
    expect(snapshot.strings[key]?.tr['fr']).toBe('missing');
    expect(snapshot.strings[key]?.tr['de']).toBe('ok');
  });
});

describe('summarize', () => {
  it('words conditions and effects in plain English, and never hides one it does not know', () => {
    expect(summarize({ kind: 'quest-status', questId: 'screen-test', status: 'available' })).toBe('quest "screen-test" is available');
    expect(summarize({ kind: 'resource-delta', delta: { energy: -10, money: 5 } })).toBe('energy -10, money +5');
    expect(summarize({ kind: 'relationship-delta', characterId: 'rival', delta: { trust: 2 } })).toBe('rival: trust +2');
    expect(summarize({ kind: 'quest-action', action: 'complete-stage', questId: 'q', stageId: 's' })).toBe('complete-stage quest "q" (stage "s")');
    expect(summarize({ kind: 'mystery' } as never)).toBe('{"kind":"mystery"}');
  });
});
