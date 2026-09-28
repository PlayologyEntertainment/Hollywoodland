// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync, readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { I18n, type Catalog } from '../src/i18n/I18n';
import { formatDateTime, formatList, formatNumber, formatPercent, segmentWords } from '../src/i18n/format';
import { LOCALES, SOURCE_LOCALE, isSupportedLocale, resolveLocale } from '../src/i18n/locales';
import { formatMessage } from '../src/i18n/message';
import { applyStaticTranslations, type TranslatableElement } from '../src/i18n/staticText';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const localesDir = new URL('../src/locales/', import.meta.url);

function loaderFor(catalogs: Record<string, Catalog>): (locale: string) => Promise<Catalog> {
  return async (locale) => {
    const catalog = catalogs[locale];
    if (catalog === undefined) throw new Error(`no ${locale}`);
    return catalog;
  };
}

describe('formatMessage', () => {
  it('fills named placeholders and leaves unknown ones visible', () => {
    expect(formatMessage('Hello, {name}.', { name: 'Ada' }, 'en')).toBe('Hello, Ada.');
    expect(formatMessage('Hello, {name}.', {}, 'en')).toBe('Hello, {name}.');
  });

  it('formats numbers for the locale', () => {
    expect(formatMessage('{n}', { n: 1234.5 }, 'en')).toBe('1,234.5');
    expect(formatMessage('{n}', { n: 1234.5 }, 'de')).toBe('1.234,5');
  });

  it('chooses plural branches: exact match, then category, then other', () => {
    const template = '{count, plural, =0 {No items} one {# item} other {# items}}';
    expect(formatMessage(template, { count: 0 }, 'en')).toBe('No items');
    expect(formatMessage(template, { count: 1 }, 'en')).toBe('1 item');
    expect(formatMessage(template, { count: 5 }, 'en')).toBe('5 items');
  });

  it('uses the locale plural rules, not English ones', () => {
    // Polish has separate few and many forms; English has neither.
    const template = '{n, plural, one {# plik} few {# pliki} many {# plikow} other {# pliku}}';
    expect(formatMessage(template, { n: 1 }, 'pl')).toBe('1 plik');
    expect(formatMessage(template, { n: 3 }, 'pl')).toBe('3 pliki');
    expect(formatMessage(template, { n: 5 }, 'pl')).toBe('5 plikow');
  });

  it('supports placeholders inside a plural branch', () => {
    expect(formatMessage('{count, plural, one {{who} has # coin} other {{who} has # coins}}', { count: 3, who: 'Ada' }, 'en')).toBe('Ada has 3 coins');
  });

  it('leaves malformed or non-numeric plurals as written instead of throwing', () => {
    expect(formatMessage('{count, plural, one {# item}', { count: 1 }, 'en')).toBe('{count, plural, one {# item}');
    expect(formatMessage('{count, plural, other {# x}}', { count: 'many' }, 'en')).toBe('{count, plural, other {# x}}');
  });

  it('passes multi-byte text through untouched', () => {
    expect(formatMessage('こんにちは、{name}さん。', { name: '田中' }, 'ja')).toBe('こんにちは、田中さん。');
    expect(formatMessage('{count, plural, other {#개}}', { count: 3 }, 'ko')).toBe('3개');
  });
});

describe('I18n', () => {
  const catalogs = {
    en: { greeting: 'Hello', only_en: 'English only', count: '{n, plural, one {# apple} other {# apples}}' },
    es: { greeting: 'Hola' },
  } satisfies Record<string, Catalog>;

  it('looks up the active language, then English, then the inline fallback, then the key', async () => {
    const i18n = new I18n(loaderFor(catalogs));
    await i18n.init();
    await i18n.setLocale('es');
    expect(i18n.t('greeting')).toBe('Hola');
    expect(i18n.t('only_en')).toBe('English only');
    expect(i18n.t('missing', undefined, 'Inline English')).toBe('Inline English');
    expect(i18n.t('missing')).toBe('missing');
  });

  it('interpolates params', async () => {
    const i18n = new I18n(loaderFor(catalogs));
    await i18n.init();
    expect(i18n.t('count', { n: 1 })).toBe('1 apple');
    expect(i18n.t('count', { n: 2 })).toBe('2 apples');
  });

  it('notifies listeners once the new catalog is in place', async () => {
    const i18n = new I18n(loaderFor(catalogs));
    await i18n.init();
    const seen: string[] = [];
    i18n.onChange((locale) => seen.push(`${locale}:${i18n.t('greeting')}`));
    await i18n.setLocale('es');
    await i18n.setLocale('en');
    expect(seen).toEqual(['es:Hola', 'en:Hello']);
  });

  it('ignores an unsupported locale and stays in English when a catalog fails to load', async () => {
    const i18n = new I18n(loaderFor({ en: catalogs.en }));
    await i18n.init();
    const seen: string[] = [];
    i18n.onChange((locale) => seen.push(locale));
    await i18n.setLocale('tlh');
    expect(seen).toEqual([]);
    await i18n.setLocale('fr'); // supported, but the loader has no catalog
    expect(i18n.locale).toBe('en');
    expect(seen).toEqual(['en']);
  });

  it('lets the last choice win when catalogs load out of order', async () => {
    const resolvers: Record<string, () => void> = {};
    const loader = (locale: string): Promise<Catalog> =>
      locale === 'en'
        ? Promise.resolve(catalogs.en)
        : new Promise((resolve) => {
            resolvers[locale] = () => resolve(catalogs.es);
          });
    const i18n = new I18n(loader);
    await i18n.init();
    const first = i18n.setLocale('es');
    const second = i18n.setLocale('fr');
    resolvers['fr']?.();
    await second;
    resolvers['es']?.();
    await first;
    expect(i18n.locale).toBe('fr');
  });

  it('reports whether the active language itself has a key', async () => {
    const i18n = new I18n(loaderFor(catalogs));
    await i18n.init();
    await i18n.setLocale('es');
    expect(i18n.has('greeting')).toBe(true);
    expect(i18n.has('only_en')).toBe(false);
  });
});

describe('locales', () => {
  it('knows the launch languages, English as the only source, and the rest as beta', () => {
    expect(LOCALES.map((locale) => locale.code)).toEqual(['en', 'es', 'fr', 'de', 'pt-BR']);
    expect(LOCALES.filter((locale) => locale.status === 'source').map((locale) => locale.code)).toEqual(['en']);
    expect(LOCALES.filter((locale) => locale.status === 'beta')).toHaveLength(4);
    expect(isSupportedLocale('es')).toBe(true);
    expect(isSupportedLocale('ja')).toBe(false);
  });

  it('resolves automatic from the browser languages, by exact tag then base language', () => {
    expect(resolveLocale('auto', ['de-AT', 'en-US'])).toBe('de');
    expect(resolveLocale('auto', ['pt-PT'])).toBe('pt-BR');
    expect(resolveLocale('auto', ['pt-BR'])).toBe('pt-BR');
    expect(resolveLocale('auto', ['es-MX'])).toBe('es');
    expect(resolveLocale('auto', ['ja-JP', 'fr'])).toBe('fr');
    expect(resolveLocale('auto', ['ja-JP'])).toBe(SOURCE_LOCALE);
    expect(resolveLocale('auto', [])).toBe(SOURCE_LOCALE);
  });

  it('honours a named language regardless of the browser', () => {
    expect(resolveLocale('fr', ['de'])).toBe('fr');
  });
});

describe('format helpers', () => {
  it('format numbers, percentages, dates and lists per locale', () => {
    expect(formatNumber(1234.5, 'en')).toBe('1,234.5');
    expect(formatNumber(1234.5, 'de')).toBe('1.234,5');
    expect(formatPercent(0.6, 'en')).toBe('60%');
    expect(formatDateTime('2026-09-23T10:15:00Z', 'en')).toMatch(/2026/);
    expect(formatDateTime('not a date', 'en')).toBe('not a date');
    expect(formatList(['a', 'b', 'c'], 'en')).toBe('a, b, and c');
    expect(formatList(['a', 'b', 'c'], 'es')).toBe('a, b y c');
  });

  it('segments Japanese and Chinese text into words without spaces', () => {
    expect(segmentWords('私は学生です', 'ja').length).toBeGreaterThan(1);
    expect(segmentWords('我是学生', 'zh').length).toBeGreaterThan(1);
    expect(segmentWords('hello big world', 'en')).toEqual(['hello', 'big', 'world']);
  });
});

describe('applyStaticTranslations', () => {
  function fakeElement(dataset: Record<string, string>, text = 'English'): TranslatableElement & { attrs: Record<string, string> } {
    const attrs: Record<string, string> = {};
    return {
      dataset,
      textContent: text,
      attrs,
      setAttribute: (name, value) => {
        attrs[name] = value;
      },
    };
  }

  it('replaces text and attributes for keys the language has, and leaves the rest as authored', async () => {
    const i18n = new I18n(loaderFor({ en: { a: 'A', b: 'B' }, es: { a: 'Ah', b: 'Be' } }));
    await i18n.init();
    await i18n.setLocale('es');
    const text = fakeElement({ i18n: 'a' });
    const missing = fakeElement({ i18n: 'nope' }, 'Untouched');
    const attr = fakeElement({ i18nAttr: 'aria-label:b; title:nope' });
    applyStaticTranslations({ querySelectorAll: () => [text, missing, attr] }, i18n);
    expect(text.textContent).toBe('Ah');
    expect(missing.textContent).toBe('Untouched');
    expect(attr.attrs).toEqual({ 'aria-label': 'Be' });
  });
});

describe('locale catalogs', () => {
  const codes = (readdirSync(localesDir) as string[]).filter((name) => name.endsWith('.json')).map((name) => name.replace('.json', ''));
  const read = (code: string): Record<string, string> => JSON.parse(readFileSync(new URL(`${code}.json`, localesDir), 'utf8')) as Record<string, string>;

  it('has a catalog for every supported locale and none for unsupported ones', () => {
    expect([...codes].sort()).toEqual(LOCALES.map((locale) => locale.code).sort());
  });

  it('never defines a key English lacks, and keeps placeholders identical to English', () => {
    const english = read('en');
    const placeholders = (text: string): string[] => [...text.matchAll(/\{(\w+)/g)].map((match) => match[1] as string).sort();
    for (const code of codes) {
      for (const [key, text] of Object.entries(read(code))) {
        expect(english[key], `${code}:${key} has no English source`).toBeDefined();
        expect(placeholders(text), `${code}:${key}`).toEqual(placeholders(english[key] as string));
      }
    }
  });

  it('covers every data-i18n key used in index.html in English', () => {
    const english = read('en');
    const keys = [...indexHtml.matchAll(/data-i18n="([^"]+)"/g)].map((match) => match[1] as string);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) expect(english[key], key).toBeDefined();
  });
});

describe('the Settings language row', () => {
  const appShell = readFileSync(new URL('../src/app/AppShell.ts', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
  const dialog = indexHtml.match(/<dialog id="settings-dialog"[\s\S]*?<\/dialog>/)?.[0] ?? '';

  it('is a labelled drop-down in the settings dialog', () => {
    expect(dialog).toContain('<span data-i18n="settings.language">Language</span><select id="language"></select>');
  });

  it('lists Automatic plus each language by its own name, tagging beta ones', () => {
    expect(appShell).toContain("new Option(i18n.t('settings.languageAuto', undefined, 'Automatic'), AUTO_LANGUAGE)");
    expect(appShell).toContain("locale.status === 'beta'");
    expect(appShell).toContain("language: assertElement('#language', HTMLSelectElement).value");
  });

  it('applies a language change: loads it, sets <html lang>, retranslates the markup and emits locale-changed', () => {
    expect(main).toContain('if (languageChanged) void applyLanguage(nextSettings.language)');
    expect(main).toContain('document.documentElement.lang = locale');
    expect(main).toContain('applyStaticTranslations(document, i18n)');
    expect(main).toContain("domainEvents.emit('locale-changed', { locale })");
    expect(main).toContain("import.meta.glob<Catalog>('./locales/*.json', { import: 'default' })");
  });
});
