export type MessageParams = Readonly<Record<string, string | number>>;

/** Fills a message's placeholders. Two forms, both ICU-style:
 *
 *   `Hello, {name}.`
 *   `{count, plural, =0 {No items} one {# item} other {# items}}`
 *
 * A plural picks the branch for an exact `=N` match first, then by the locale's own plural category
 * (`Intl.PluralRules`: zero, one, two, few, many, other), then `other`. Inside a branch `#` is the number, formatted for
 * the locale. Branches may hold placeholders of their own. A placeholder with no matching parameter is left as written
 * so the gap is visible rather than silently empty. */
export function formatMessage(template: string, params: MessageParams | undefined, locale: string): string {
  let out = '';
  let index = 0;
  while (index < template.length) {
    const char = template[index] as string;
    if (char !== '{') {
      out += char;
      index += 1;
      continue;
    }
    const end = matchingBrace(template, index);
    if (end === -1) {
      out += template.slice(index);
      break;
    }
    out += formatPlaceholder(template.slice(index + 1, end), template.slice(index, end + 1), params, locale);
    index = end + 1;
  }
  return out;
}

function formatPlaceholder(body: string, original: string, params: MessageParams | undefined, locale: string): string {
  const firstComma = body.indexOf(',');
  const name = (firstComma === -1 ? body : body.slice(0, firstComma)).trim();
  const value = params?.[name];
  if (value === undefined) return original;
  if (firstComma === -1) return typeof value === 'number' ? new Intl.NumberFormat(locale).format(value) : value;

  const rest = body.slice(firstComma + 1);
  const secondComma = rest.indexOf(',');
  const kind = (secondComma === -1 ? rest : rest.slice(0, secondComma)).trim();
  if (kind !== 'plural' || secondComma === -1 || typeof value !== 'number') return original;

  const branches = parseBranches(rest.slice(secondComma + 1));
  const category = new Intl.PluralRules(locale).select(value);
  const chosen = branches.get(`=${value}`) ?? branches.get(category) ?? branches.get('other');
  if (chosen === undefined) return original;
  const number = new Intl.NumberFormat(locale).format(value);
  return formatMessage(chosen.replaceAll('#', number), params, locale);
}

/** `=0 {…} one {…} other {…}` as a map from selector to branch text. */
function parseBranches(text: string): Map<string, string> {
  const branches = new Map<string, string>();
  let index = 0;
  while (index < text.length) {
    const open = text.indexOf('{', index);
    if (open === -1) break;
    const selector = text.slice(index, open).trim();
    const close = matchingBrace(text, open);
    if (close === -1) break;
    if (selector !== '') branches.set(selector, text.slice(open + 1, close));
    index = close + 1;
  }
  return branches;
}

function matchingBrace(text: string, open: number): number {
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1;
    else if (text[index] === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}
