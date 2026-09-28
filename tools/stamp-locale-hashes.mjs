// Records, for each translated string, a fingerprint of the English it was translated from (src/locales/meta/<code>.json), so
// a later change to the English shows up as a stale translation in `npm run i18n:check`.
//
//   node tools/stamp-locale-hashes.mjs            stamp every language except English
//   node tools/stamp-locale-hashes.mjs es fr      stamp only these
//
// Run it right after a language has been (re)translated against the current English: it vouches for every string the
// catalog holds, so do not run it just to silence a stale warning.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

import { hashText } from '../src/i18n/hash.ts';

const localesDir = new URL('../src/locales/', import.meta.url);
const english = JSON.parse(readFileSync(new URL('en.json', localesDir), 'utf8'));
const requested = process.argv.slice(2);
const codes = (requested.length > 0 ? requested : readdirSync(localesDir).filter((name) => name.endsWith('.json')).map((name) => name.replace('.json', ''))).filter(
  (code) => code !== 'en',
);

mkdirSync(new URL('meta/', localesDir), { recursive: true });
for (const code of codes) {
  const path = new URL(`${code}.json`, localesDir);
  if (!existsSync(path)) {
    console.error(`No catalog for ${code}`);
    process.exitCode = 1;
    continue;
  }
  const catalog = JSON.parse(readFileSync(path, 'utf8'));
  const hashes = {};
  for (const key of Object.keys(catalog).sort()) {
    if (key in english) hashes[key] = hashText(english[key]);
  }
  writeFileSync(new URL(`meta/${code}.json`, localesDir), `${JSON.stringify({ hashes }, null, 2)}\n`);
  console.log(`${code}: stamped ${Object.keys(hashes).length} strings`);
}
