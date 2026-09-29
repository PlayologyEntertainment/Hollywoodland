// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { LOCALES } from '../src/i18n/locales';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8') as string;
const readJson = (path: string): Record<string, string> => JSON.parse(read(path)) as Record<string, string>;

const english = readJson('../src/locales/en.json');
const drafts = LOCALES.filter((locale) => locale.code !== 'en').map((locale) => ({ code: locale.code, catalog: readJson(`../src/locales/${locale.code}.json`) }));

/** Proper names stay exactly as written in every language (owner decision; docs/localization/glossary.md). */
const PROPER_NAMES = [
  'Hollywoodland',
  'Playology Entertainment',
  'Bellhaven Rooms',
  'Sunset Casting Exchange',
  'The Gilded Spoon',
  'The Silver Thimble',
  'The Klieg Light',
  'The Celestial Palace',
  'Monarch Pictures',
  "The Corsair's Daughter",
  'serdar@playologyentertainment.com',
];

describe('the AI first drafts', () => {
  it('cover every English string', () => {
    for (const { code, catalog } of drafts) {
      expect(Object.keys(catalog).filter((key) => !(key in english)), code).toEqual([]);
      expect(Object.keys(english).filter((key) => !(key in catalog)), code).toEqual([]);
    }
  });

  it('leave every proper name exactly as written', () => {
    const lost: string[] = [];
    for (const { code, catalog } of drafts) {
      for (const [key, text] of Object.entries(english)) {
        for (const name of PROPER_NAMES) {
          if (text.includes(name) && !(catalog[key] as string).includes(name)) lost.push(`${code} ${key}: "${name}"`);
        }
      }
    }
    expect(lost).toEqual([]);
  });

  it('keep a trailing energy cost in parentheses at the very end, the shape the game highlights', () => {
    const broken: string[] = [];
    for (const { code, catalog } of drafts) {
      for (const [key, text] of Object.entries(english)) {
        if (!/\s\(-\d+ Energy\)$/.test(text)) continue;
        const cost = text.match(/\(-(\d+) Energy\)$/)?.[1];
        if (!new RegExp(`\\s\\(-${cost} [^)]+\\)$`).test(catalog[key] as string)) broken.push(`${code} ${key}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('keep the numbers of the English (costs, rewards, dates) in the same text', () => {
    const changed: string[] = [];
    for (const { code, catalog } of drafts) {
      for (const [key, text] of Object.entries(english)) {
        if (key.startsWith('legal.') && /September 22, 2026/.test(text)) continue; // the date is written out in the language
        const numbers = (value: string): string => (value.match(/\d+/g) ?? []).sort().join(',');
        if (numbers(text) !== numbers(catalog[key] as string)) changed.push(`${code} ${key}: ${numbers(text)} vs ${numbers(catalog[key] as string)}`);
      }
    }
    expect(changed).toEqual([]);
  });

  it('actually differ from English wherever English has ordinary words', () => {
    const untouched: string[] = [];
    for (const { code, catalog } of drafts) {
      for (const [key, text] of Object.entries(english)) {
        const words = text.replace(/\{[^}]*\}/g, '').match(/[A-Za-z]{4,}/g) ?? [];
        if (words.length >= 3 && catalog[key] === text) untouched.push(`${code} ${key}`);
      }
    }
    expect(untouched).toEqual([]);
  });
});

describe('the legal text', () => {
  const indexHtml = read('../index.html');
  const main = read('../src/main.ts');

  it('shows a notice that the English version governs above each translated document, and hides it in English', () => {
    for (const dialog of ['legal-terms-dialog', 'legal-privacy-dialog']) {
      const block = indexHtml.match(new RegExp(`<dialog id="${dialog}"[\\s\\S]*?</dialog>`))?.[0] ?? '';
      expect(block, dialog).toContain('class="legal-language-note" data-i18n="legal.governingLanguage" hidden');
    }
    expect(main).toContain("note.hidden = locale === 'en'");
    for (const { code, catalog } of drafts) expect(catalog['legal.governingLanguage'], code).toBeTruthy();
  });

  it('stays unreviewed for every language until a qualified reviewer signs it off', () => {
    for (const locale of LOCALES.filter((info) => info.code !== 'en')) {
      expect(locale.legalReviewed, locale.code).toBe(false);
      expect(locale.status, locale.code).toBe('beta');
    }
  });
});
