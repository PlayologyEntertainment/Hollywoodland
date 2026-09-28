/** Locale-aware formatting for numbers, dates and lists, so nothing hard-codes English punctuation or order. All of it is
 * the browser's own `Intl`. */

export function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatPercent(fraction: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(fraction);
}

/** "Sep 23, 2026, 10:15 AM" in English; the local equivalent elsewhere. An unparseable date is returned as given. */
export function formatDateTime(iso: string, locale: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
}

/** "$5, 10 XP and a costume" style joining, with the locale's own separators and its word for "and". */
export function formatList(items: readonly string[], locale: string): string {
  return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items);
}

/** Splits text into words with the browser's dictionary, which is how Japanese, Chinese and Thai get word boundaries
 * without spaces. Falls back to whitespace splitting where `Intl.Segmenter` is missing. */
export function segmentWords(text: string, locale: string): string[] {
  if (typeof Intl.Segmenter === 'function') {
    return Array.from(new Intl.Segmenter(locale, { granularity: 'word' }).segment(text))
      .filter((part) => part.isWordLike === true)
      .map((part) => part.segment);
  }
  return text.split(/\s+/).filter((word) => word !== '');
}
