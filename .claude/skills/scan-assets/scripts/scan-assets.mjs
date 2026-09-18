#!/usr/bin/env node
// Finds asset paths referenced by the game's code/data/markup that have no
// matching file under public/. Detection only -- writes nothing, generates
// nothing. See ../SKILL.md for what to do with its output.

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ASSET_PATH_RE = /assets\/[A-Za-z0-9_\-./]+\.(?:png|webp|jpe?g|svg|gif)/g;

const SCAN_ROOTS = [
  { dir: 'src', extensions: ['.ts', '.tsx'] },
  { dir: 'public/data', extensions: ['.json'] },
];
const SCAN_FILES = ['index.html'];

function parseArgs(argv) {
  const flags = { cwd: process.cwd(), json: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--cwd') flags.cwd = argv[++i];
    else if (arg === '--json') flags.json = true;
    else if (arg === '--help' || arg === '-h') flags.help = true;
    else throw new Error(`unrecognized argument: ${arg}`);
  }
  return flags;
}

async function collectFiles(root, extensions) {
  const out = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (extensions.includes(path.extname(entry.name))) out.push(full);
    }
  }
  await walk(root);
  return out;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

async function scanFile(cwd, relFile, refs) {
  const text = await readFile(path.join(cwd, relFile), 'utf8');
  for (const match of text.matchAll(ASSET_PATH_RE)) {
    const assetPath = match[0];
    const line = lineOf(text, match.index);
    if (!refs.has(assetPath)) refs.set(assetPath, []);
    refs.get(assetPath).push({ file: relFile, line });
  }
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    console.log(
      'Usage: scan-assets.mjs [--cwd <project-dir>] [--json]\n\n' +
        'Scans src/**, public/data/**/*.json, and index.html for asset paths\n' +
        '("assets/...") and reports the ones with no matching file under public/.'
    );
    return;
  }
  const cwd = path.resolve(flags.cwd);

  const files = [];
  for (const { dir, extensions } of SCAN_ROOTS) {
    files.push(...(await collectFiles(path.join(cwd, dir), extensions)).map((f) => path.relative(cwd, f)));
  }
  for (const f of SCAN_FILES) {
    if (existsSync(path.join(cwd, f))) files.push(f);
  }

  const refs = new Map();
  for (const relFile of files) await scanFile(cwd, relFile, refs);

  const missing = [];
  for (const [assetPath, referencedIn] of refs) {
    const onDisk = existsSync(path.join(cwd, 'public', assetPath));
    if (!onDisk) missing.push({ path: assetPath, referencedIn });
  }
  missing.sort((a, b) => a.path.localeCompare(b.path));

  const result = {
    scannedFiles: files.length,
    totalReferenced: refs.size,
    missing,
  };

  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Scanned ${result.scannedFiles} files, found ${result.totalReferenced} distinct asset references.`);
  if (missing.length === 0) {
    console.log('No missing assets -- every referenced path has a matching file under public/.');
    return;
  }
  console.log(`\n${missing.length} referenced asset(s) have no file on disk:\n`);
  for (const m of missing) {
    console.log(`  public/${m.path}`);
    for (const ref of m.referencedIn) console.log(`    referenced in ${ref.file}:${ref.line}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
