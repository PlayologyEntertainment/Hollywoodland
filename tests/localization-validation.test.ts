// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { existsSync, readFileSync, readdirSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { findUnusedKeys, validateLocalization, type LocaleInput } from '../src/content/LocalizationValidator';
import { collectContentStrings } from '../src/i18n/contentStrings';
import { hashText } from '../src/i18n/hash';
import { LOCALES } from '../src/i18n/locales';
import { analyzeMessage } from '../src/i18n/message';

const stampedFrom = (english: Record<string, string>, catalog: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.keys(catalog).map((key) => [key, hashText(english[key] ?? '')]));

function locale(code: string, status: LocaleInput['status'], catalog: Record<string, string>, english: Record<string, string>, legalReviewed = false): LocaleInput {
  return { code, status, legalReviewed, catalog, hashes: stampedFrom(english, catalog) };
}

describe('analyzeMessage', () => {
  it('lists parameters, including those inside plural branches, and each plural selectors', () => {
    const analysis = analyzeMessage('{who} has {n, plural, =0 {none} one {# {thing}} other {# things}}');
    expect(analysis.balanced).toBe(true);
    expect(analysis.params).toEqual(['n', 'thing', 'who']);
    expect(analysis.plurals).toEqual([{ param: 'n', selectors: ['=0', 'one', 'other'] }]);
  });

  it('notices unbalanced braces', () => {
    expect(analyzeMessage('Hello {name').balanced).toBe(false);
    expect(analyzeMessage('Hello name}').balanced).toBe(false);
    expect(analyzeMessage('No placeholders').params).toEqual([]);
  });
});

describe('hashText', () => {
  it('is stable, short and sensitive to any change', () => {
    expect(hashText('Play')).toBe(hashText('Play'));
    expect(hashText('Play')).toMatch(/^[0-9a-f]{8}$/);
    expect(hashText('Play')).not.toBe(hashText('play'));
    expect(hashText('こんにちは')).not.toBe(hashText('こんにちわ'));
  });
});

describe('validateLocalization', () => {
  const english = {
    'a.greet': 'Hello, {name}.',
    'a.count': '{n, plural, one {# apple} other {# apples}}',
    'a.plain': 'Play',
    'legal.terms.p01': 'These are the terms.',
  };

  it('passes a complete, well-formed reviewed language', () => {
    const es = { 'a.greet': 'Hola, {name}.', 'a.count': '{n, plural, one {# manzana} other {# manzanas}}', 'a.plain': 'Jugar', 'legal.terms.p01': 'Estos son los términos.' };
    const report = validateLocalization(english, [locale('es', 'reviewed', es, english, true)]);
    expect(report.errors).toEqual([]);
    expect(report.coverage['es']).toEqual({ translated: 4, total: 4 });
  });

  it('always rejects a key English lacks, unbalanced braces, and a changed placeholder set', () => {
    const es = { 'a.greet': 'Hola, {nombre}.', 'a.plain': 'Jugar {', 'a.extra': 'Sobra' };
    const { errors } = validateLocalization(english, [locale('es', 'beta', es, english)]);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('"a.greet" uses {nombre} but English uses {name}'),
        expect.stringContaining('"a.plain" has unbalanced braces'),
        expect.stringContaining('"a.extra" has no English source'),
      ]),
    );
  });

  it('requires other, and one where the language has one, in every plural', () => {
    const noOther = { 'a.count': '{n, plural, one {# manzana}}' };
    const noOne = { 'a.count': '{n, plural, other {# manzanas}}' };
    expect(validateLocalization(english, [locale('es', 'beta', noOther, english)]).errors.join('\n')).toContain('no "other" branch');
    expect(validateLocalization(english, [locale('es', 'beta', noOne, english)]).errors.join('\n')).toContain('no "one" branch');
  });

  it('only warns when a plural lacks a rarer form the language has', () => {
    const es = { 'a.count': '{n, plural, one {# manzana} other {# manzanas}}' };
    const pl = { 'a.count': '{n, plural, one {# jablko} other {# jablek}}' };
    expect(validateLocalization(english, [locale('pl', 'beta', pl, english)]).errors).toEqual([]);
    expect(validateLocalization(english, [locale('pl', 'beta', pl, english)]).warnings.join('\n')).toMatch(/lacks few, many/);
    expect(validateLocalization(english, [locale('es', 'beta', es, english)]).errors).toEqual([]);
  });

  it('warns about gaps and stale strings in a beta language but fails a reviewed one', () => {
    const partial = { 'a.plain': 'Jugar' };
    const stale = { ...locale('es', 'beta', partial, english), hashes: { 'a.plain': hashText('Old English') } };
    const beta = validateLocalization(english, [stale]);
    expect(beta.errors).toEqual([]);
    expect(beta.warnings.join('\n')).toContain('3 of 4 strings are not translated yet');
    expect(beta.warnings.join('\n')).toContain('1 translations may be out of date');

    const reviewed = validateLocalization(english, [{ ...stale, status: 'reviewed' }]);
    expect(reviewed.errors.join('\n')).toContain('3 of 4 strings are not translated yet');
    expect(reviewed.errors.join('\n')).toContain('1 translations may be out of date');
  });

  it('treats an unstamped translation as stale', () => {
    const es = { 'a.plain': 'Jugar' };
    const report = validateLocalization(english, [{ ...locale('es', 'beta', es, english), hashes: {} }]);
    expect(report.warnings.join('\n')).toContain('1 translations may be out of date');
  });

  it('does not let a language be reviewed until its legal text has been signed off', () => {
    const es = { 'a.greet': 'Hola, {name}.', 'a.count': '{n, plural, one {# manzana} other {# manzanas}}', 'a.plain': 'Jugar', 'legal.terms.p01': 'Términos.' };
    expect(validateLocalization(english, [locale('es', 'reviewed', es, english, false)]).errors.join('\n')).toContain('legal text');
    expect(validateLocalization(english, [locale('es', 'beta', es, english, false)]).errors).toEqual([]);
  });

  it('rejects broken English too', () => {
    expect(validateLocalization({ 'a.bad': 'Oops {name' }, []).errors).toEqual(['en: "a.bad" has unbalanced braces.']);
  });
});

describe('findUnusedKeys', () => {
  it('reports keys nothing uses, ignoring used keys and dynamic families', () => {
    expect(findUnusedKeys({ a: 'x', b: 'y', 'fam.one': 'z' }, new Set(['a']), ['fam.'])).toEqual(['b']);
  });
});

describe('the shipped catalogs', () => {
  const dir = new URL('../src/locales/', import.meta.url);
  const readJson = (url: URL): Record<string, string> => JSON.parse(readFileSync(url, 'utf8') as string) as Record<string, string>;
  const english = readJson(new URL('en.json', dir));

  const inputs: LocaleInput[] = LOCALES.filter((info) => info.code !== 'en').map((info) => {
    const metaUrl = new URL(`meta/${info.code}.json`, dir);
    const meta = existsSync(metaUrl) ? (JSON.parse(readFileSync(metaUrl, 'utf8') as string) as { hashes?: Record<string, string> }) : {};
    return {
      code: info.code,
      status: info.status === 'reviewed' ? 'reviewed' : 'beta',
      legalReviewed: info.legalReviewed,
      catalog: readJson(new URL(`${info.code}.json`, dir)),
      hashes: meta.hashes ?? {},
    };
  });
  const report = validateLocalization(english, inputs);

  it('have no errors (a reviewed language must be complete and current; every language must be well-formed)', () => {
    expect(report.errors).toEqual([]);
  });

  it('report how far each language has got (warnings are informational for beta languages)', () => {
    for (const [code, { translated, total }] of Object.entries(report.coverage)) {
      console.log(`i18n ${code}: ${translated}/${total} strings translated (${Math.round((translated / total) * 100)}%)`);
    }
    for (const warning of report.warnings) console.log(`i18n warning: ${warning}`);
    expect(Object.keys(report.coverage).sort()).toEqual(inputs.map((input) => input.code).sort());
  });

  it('keep the review status in the registry honest: only reviewed languages can be legally reviewed', () => {
    for (const info of LOCALES) {
      if (info.status === 'beta') expect(info.legalReviewed, info.code).toBe(false);
    }
  });

  it('have a hash stamp file for every language that has strings', () => {
    for (const input of inputs) {
      if (Object.keys(input.catalog).length > 0) expect(existsSync(new URL(`meta/${input.code}.json`, dir)), input.code).toBe(true);
    }
  });

  it('contain no English key that nothing uses', () => {
    const used = new Set<string>();
    const files = (readdirSync(new URL('../src/', import.meta.url), { recursive: true }) as string[]).filter((name) => name.endsWith('.ts'));
    for (const file of files) {
      const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8') as string;
      for (const match of source.matchAll(/(?:^|[^\w])t\('([^']+)'/gm)) used.add(match[1] as string);
    }
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8') as string;
    for (const match of html.matchAll(/data-i18n="([^"]+)"/g)) used.add(match[1] as string);
    for (const match of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
      for (const pair of (match[1] as string).split(';')) used.add(pair.split(':')[1]?.trim() ?? '');
    }
    for (const key of Object.keys(collectContentStrings())) used.add(key);
    // Keys the code builds at run time from an enum; tests/i18n.test.ts checks each family is complete.
    const families = ['time.slot.', 'time.weekday.', 'relationship.label.', 'audition.outcome.', 'attribute.', 'item.category.', 'talent.branch.', 'title.career.', 'title.home.'];
    expect(used.size, 'the scan found the keys in use').toBeGreaterThan(300);
    expect(findUnusedKeys(english, used, families)).toEqual([]);
  });
});
