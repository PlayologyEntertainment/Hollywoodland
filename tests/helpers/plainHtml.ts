/** `index.html` as a reader sees it in English: the i18n attributes removed and the spans that only carry a `data-i18n` key
 * unwrapped. Lets layout tests keep asserting on the visible markup (`<button …>Play</button>`) without caring how the text
 * is tagged for translation. */
export function plainHtml(html: string): string {
  return html
    .replace(/<span data-i18n="[^"]*">([\s\S]*?)<\/span>/g, '$1')
    .replace(/ data-i18n-attr="[^"]*"/g, '')
    .replace(/ data-i18n="[^"]*"/g, '');
}
