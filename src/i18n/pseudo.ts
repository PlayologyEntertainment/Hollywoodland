import { mapMessageText } from './message';

const ACCENTS: Readonly<Record<string, string>> = {
  a: 'á', b: 'ƀ', c: 'ç', d: 'ð', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'í', j: 'ĵ', k: 'ķ', l: 'ļ', m: 'ɱ', n: 'ñ', o: 'ö', p: 'þ', q: 'ǫ',
  r: 'ŕ', s: 'š', t: 'ţ', u: 'ü', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž',
  A: 'Á', B: 'Ɓ', C: 'Ç', D: 'Ð', E: 'É', F: 'Ƒ', G: 'Ĝ', H: 'Ĥ', I: 'Í', J: 'Ĵ', K: 'Ķ', L: 'Ļ', M: 'Ṁ', N: 'Ñ', O: 'Ö', P: 'Þ', Q: 'Ǫ',
  R: 'Ŕ', S: 'Š', T: 'Ţ', U: 'Ü', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ', Y: 'Ý', Z: 'Ž',
};

/** How much longer than English the stretched text is. German and French routinely run 20 to 40 percent longer; this is the
 * top of that range. */
export const PSEUDO_EXPANSION = 0.4;

/** A stress-test rendering of an English message: every letter accented (so it is obvious what is translated and that the fonts
 * cope with more than plain ASCII), every run of words stretched by about 40 percent, and the whole thing wrapped in brackets
 * (so text cut off by a container shows straight away as a missing closing bracket). Placeholders and plurals are untouched,
 * so the result is a valid message with the same parameters. */
export function pseudoLocalize(message: string): string {
  const stretched = mapMessageText(message, (text) => {
    const accented = Array.from(text, (char) => ACCENTS[char] ?? char).join('');
    if (accented.trim() === '') return accented;
    return `${accented}${'~'.repeat(Math.ceil(text.trim().length * PSEUDO_EXPANSION))}`;
  });
  return `[${stretched}]`;
}

export function pseudoCatalog(english: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(Object.entries(english).map(([key, text]) => [key, pseudoLocalize(text)]));
}
