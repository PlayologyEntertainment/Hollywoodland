import type { I18n } from './I18n';

/** The slice of an element this needs; a real element satisfies it, and tests pass a fake. */
export interface TranslatableElement {
  readonly dataset: Readonly<Record<string, string | undefined>>;
  textContent: string | null;
  setAttribute(name: string, value: string): void;
}

export interface TranslatableRoot {
  querySelectorAll(selector: string): Iterable<TranslatableElement>;
}

/** Translates the static markup in `index.html`.
 *
 * `data-i18n="key"` replaces an element's text with that key's string; `data-i18n-attr="aria-label:key;title:key2"`
 * does the same for attributes. The English already in the HTML is both the no-JS fallback and the fallback text, so a key
 * with no translation leaves the element as authored. Safe to re-run whenever the language changes. */
export function applyStaticTranslations(root: TranslatableRoot, i18n: I18n): void {
  for (const element of root.querySelectorAll('[data-i18n], [data-i18n-attr]')) {
    const key = element.dataset.i18n;
    if (key !== undefined && i18n.has(key)) element.textContent = i18n.t(key);

    const attrs = element.dataset.i18nAttr;
    if (attrs === undefined) continue;
    for (const pair of attrs.split(';')) {
      const [name, attrKey] = pair.split(':').map((part) => part.trim());
      if (name !== undefined && name !== '' && attrKey !== undefined && attrKey !== '' && i18n.has(attrKey)) {
        element.setAttribute(name, i18n.t(attrKey));
      }
    }
  }
}
