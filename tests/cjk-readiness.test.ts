// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { validateLocalization } from '../src/content/LocalizationValidator';
import { LOCALES, TEST_LOCALES, isLoadableLocale, isSupportedLocale } from '../src/i18n/locales';
import { analyzeMessage, formatMessage } from '../src/i18n/message';
import { PSEUDO_EXPANSION, pseudoCatalog, pseudoLocalize } from '../src/i18n/pseudo';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8') as string;
const readJson = (path: string): Record<string, string> => JSON.parse(read(path)) as Record<string, string>;

const english = readJson('../src/locales/en.json');
const css = read('../src/styles.css');

describe('test-only languages', () => {
  it('are loadable but never offered to players or accepted as a saved setting', () => {
    expect([...TEST_LOCALES]).toEqual(['en-XA', 'ja']);
    for (const code of TEST_LOCALES) {
      expect(isLoadableLocale(code), code).toBe(true);
      expect(isSupportedLocale(code), code).toBe(false);
      expect(LOCALES.map((locale) => locale.code)).not.toContain(code);
    }
    expect(isLoadableLocale('klingon')).toBe(false);
  });

  it('honours ?lang for a test language for one visit without saving it', () => {
    const main = read('../src/main.ts');
    expect(main).toContain("new URLSearchParams(window.location.search).get('lang')");
    expect(main).toContain('isLoadableLocale(testLanguage) ? i18n.setLocale(testLanguage) : applyLanguage(settings.language)');
  });
});

describe('pseudo-localization', () => {
  it('accents English, stretches it about 40 percent, and wraps it in brackets', () => {
    const out = pseudoLocalize('Enter Hollywood');
    expect(out.startsWith('[') && out.endsWith(']')).toBe(true);
    expect(out).toContain('Éñţéŕ');
    expect(out).not.toContain('Enter');
    expect(out.length).toBeGreaterThanOrEqual('Enter Hollywood'.length * (1 + PSEUDO_EXPANSION));
  });

  it('keeps placeholders, plurals and number markers intact, so every message stays valid', () => {
    for (const [key, text] of Object.entries(english)) {
      const before = analyzeMessage(text);
      const after = analyzeMessage(pseudoLocalize(text));
      expect(after.balanced, key).toBe(true);
      expect(after.params, key).toEqual(before.params);
      expect(after.plurals, key).toEqual(before.plurals);
    }
    expect(formatMessage(pseudoLocalize('{n, plural, one {# item} other {# items}}'), { n: 3 }, 'en')).toMatch(/^\[.*3.*\]$/);
    expect(pseudoLocalize('Hello, {name}.')).toContain('{name}');
  });

  it('stretches every string of the real catalog', () => {
    const pseudo = pseudoCatalog(english);
    expect(Object.keys(pseudo)).toEqual(Object.keys(english));
    const notGrown = Object.entries(english).filter(([key, text]) => text.trim() !== '' && (pseudo[key] as string).length <= text.length);
    expect(notGrown).toEqual([]);
  });
});

describe('the Japanese sample', () => {
  const ja = readJson('../src/locales/ja.json');
  const meta = JSON.parse(read('../src/locales/meta/ja.json')) as { hashes: Record<string, string> };

  it('is real Japanese, in every string', () => {
    expect(Object.keys(ja).length).toBeGreaterThan(40);
    for (const [key, text] of Object.entries(ja)) expect(text, key).toMatch(/[぀-ヿ一-鿿]/);
  });

  it('is valid against English: no unknown keys, same placeholders, well-formed plurals, none out of date', () => {
    const report = validateLocalization(english, [{ code: 'ja', status: 'beta', legalReviewed: false, catalog: ja, hashes: meta.hashes }]);
    expect(report.errors).toEqual([]);
    expect(report.warnings.filter((warning) => warning.includes('out of date'))).toEqual([]);
  });

  it('formats Japanese and Korean plurals and numbers by their own rules (a single form)', () => {
    expect(formatMessage('{cost, plural, other {#ポイント}}', { cost: 1 }, 'ja')).toBe('1ポイント');
    expect(formatMessage('{n}', { n: 12345 }, 'ja')).toBe('12,345');
    expect(formatMessage('{n, plural, other {#개}}', { n: 2 }, 'ko')).toBe('2개');
  });
});

describe('the stylesheet for Asian languages', () => {
  it('gives each language its own fallback fonts, regional ones first', () => {
    for (const [lang, fonts] of [
      ['ja', ['Yu Gothic UI', 'Hiragino Sans', 'Noto Sans CJK JP']],
      ['zh', ['PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC']],
      ['ko', ['Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans CJK KR']],
    ] as const) {
      const block = css.match(new RegExp(`:root:lang\\(${lang}\\) \\{([^}]*)\\}`))?.[1] ?? '';
      for (const font of fonts) expect(block, `${lang} ${font}`).toContain(font);
      expect(block, lang).toContain('--sans-font');
      expect(block, lang).toContain('--display-font');
    }
  });

  it('reaches every plain-text font through variables, so a language can swap them', () => {
    expect(css).toContain('--sans-font: Arial, sans-serif;');
    expect(css).not.toMatch(/font-family: Arial/);
  });

  it('drops Latin-only styling for Asian text and breaks lines the CJK way', () => {
    expect(css).toMatch(/:root:is\(:lang\(ja\), :lang\(zh\), :lang\(ko\)\) \* \{ letter-spacing: 0; font-style: normal; \}/);
    expect(css).toMatch(/:root:is\(:lang\(ja\), :lang\(zh\)\) \{ line-break: strict; overflow-wrap: anywhere; \}/);
    expect(css).toMatch(/:root:lang\(ko\) \{ word-break: keep-all;/);
    expect(css).toMatch(/\.hud-label[^{]*\{\s*font-size: max\(\.8rem, 1em\);/);
  });

  it('no longer hard-codes English: the Wait tooltip comes from the catalog', () => {
    expect(css).not.toContain("content: '+20 Energy'");
    expect(css).toContain('content: attr(data-tooltip);');
    expect(english['advanceTime.tooltip']).toBe('+20 Energy');
    expect(read('../index.html')).toContain('data-i18n-attr="data-tooltip:advanceTime.tooltip"');
  });
});
