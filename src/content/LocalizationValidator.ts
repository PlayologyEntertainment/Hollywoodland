import { hashText } from '../i18n/hash';
import { analyzeMessage } from '../i18n/message';

export type LocaleReviewStatus = 'reviewed' | 'beta';

/** One translated language, as the validator sees it. */
export interface LocaleInput {
  readonly code: string;
  readonly status: LocaleReviewStatus;
  /** Whether a qualified reviewer has signed off the legal text (keys under `legal.`), which is tracked apart from the rest. */
  readonly legalReviewed: boolean;
  readonly catalog: Readonly<Record<string, string>>;
  /** For each translated key, the fingerprint (see hashText) of the English it was translated from. */
  readonly hashes: Readonly<Record<string, string>>;
}

export interface LocalizationReport {
  /** Problems that must stop a release: a broken message, or anything short of complete in a `reviewed` language. */
  readonly errors: string[];
  /** Things worth knowing: a `beta` language's gaps and stale strings. English is used wherever a string is missing. */
  readonly warnings: string[];
  readonly coverage: Readonly<Record<string, { readonly translated: number; readonly total: number }>>;
}

const LIST_LIMIT = 5;

function sample(keys: readonly string[]): string {
  const shown = keys.slice(0, LIST_LIMIT).join(', ');
  return keys.length > LIST_LIMIT ? `${shown}, and ${keys.length - LIST_LIMIT} more` : shown;
}

/** Checks every language's catalog against English.
 *
 * Always an error, in any language: a key English does not have; unbalanced braces; a placeholder set that differs from the
 * English (a translation that drops or invents `{name}` shows the wrong thing); a plural with no `other` branch, or, where the
 * language has a `one` form, no `one` branch.
 *
 * An error in a `reviewed` language and a warning in a `beta` one: missing keys, strings translated from English that has since
 * changed, and (for legal text) a reviewed language whose legal text has not been signed off. A plural missing one of the
 * language's other forms (`few`, `many`, ...) is a warning either way, because it only shows for particular numbers. */
export function validateLocalization(english: Readonly<Record<string, string>>, locales: readonly LocaleInput[]): LocalizationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const coverage: Record<string, { translated: number; total: number }> = {};
  const englishKeys = Object.keys(english);
  const englishAnalysis = new Map(englishKeys.map((key) => [key, analyzeMessage(english[key] as string)]));

  for (const key of englishKeys) {
    if (!(englishAnalysis.get(key) as ReturnType<typeof analyzeMessage>).balanced) errors.push(`en: "${key}" has unbalanced braces.`);
  }

  for (const locale of locales) {
    const strict = locale.status === 'reviewed';
    const problem = (message: string): void => void (strict ? errors : warnings).push(message);
    const translatedKeys = Object.keys(locale.catalog);
    coverage[locale.code] = { translated: translatedKeys.filter((key) => key in english).length, total: englishKeys.length };

    for (const key of translatedKeys) {
      const source = english[key];
      if (source === undefined) {
        errors.push(`${locale.code}: "${key}" has no English source.`);
        continue;
      }
      const text = locale.catalog[key] as string;
      const analysis = analyzeMessage(text);
      if (!analysis.balanced) {
        errors.push(`${locale.code}: "${key}" has unbalanced braces.`);
        continue;
      }
      const expected = (englishAnalysis.get(key) as ReturnType<typeof analyzeMessage>).params;
      if (analysis.params.join(',') !== expected.join(',')) {
        errors.push(`${locale.code}: "${key}" uses {${analysis.params.join(', ')}} but English uses {${expected.join(', ')}}.`);
      }
      const categories = new Intl.PluralRules(locale.code).resolvedOptions().pluralCategories as string[];
      for (const plural of analysis.plurals) {
        const has = (selector: string): boolean => plural.selectors.includes(selector);
        if (!has('other')) errors.push(`${locale.code}: "${key}" plural on {${plural.param}} has no "other" branch.`);
        else if (categories.includes('one') && !has('one')) errors.push(`${locale.code}: "${key}" plural on {${plural.param}} has no "one" branch.`);
        else {
          const absent = categories.filter((category) => category !== 'other' && category !== 'one' && !has(category));
          if (absent.length > 0) warnings.push(`${locale.code}: "${key}" plural on {${plural.param}} lacks ${absent.join(', ')}; "other" is used for those numbers.`);
        }
      }
    }

    const missing = englishKeys.filter((key) => !(key in locale.catalog));
    if (missing.length > 0) {
      problem(`${locale.code}: ${missing.length} of ${englishKeys.length} strings are not translated yet (${sample(missing)}); English is shown for them.`);
    }

    const stale = translatedKeys.filter((key) => key in english && locale.hashes[key] !== hashText(english[key] as string));
    if (stale.length > 0) {
      problem(`${locale.code}: ${stale.length} translations may be out of date, or were never stamped with the English they came from (${sample(stale)}).`);
    }

    if (strict && !locale.legalReviewed && englishKeys.some((key) => key.startsWith('legal.'))) {
      errors.push(`${locale.code}: is marked reviewed, but its legal text (keys under legal.) has not been signed off.`);
    }
  }

  return { errors, warnings, coverage };
}

/** English keys that nothing uses. `used` is every key the code, the markup and the content refer to; `usedPrefixes` are the
 * families the code builds keys from at run time (`time.weekday.` and so on). */
export function findUnusedKeys(english: Readonly<Record<string, string>>, used: ReadonlySet<string>, usedPrefixes: readonly string[]): string[] {
  return Object.keys(english).filter((key) => !used.has(key) && !usedPrefixes.some((prefix) => key.startsWith(prefix)));
}
