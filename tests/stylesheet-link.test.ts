// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8') as string;
const mainTs = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8') as string;

describe('stylesheet loading', () => {
  it('links the stylesheet from the HTML head so the first paint is styled', () => {
    const head = indexHtml.match(/<head>[\s\S]*?<\/head>/)?.[0];
    expect(head).toMatch(/<link rel="stylesheet" href="\/src\/styles\.css"/);
  });

  it('does not import the stylesheet from JavaScript', () => {
    // In the dev server an imported stylesheet is injected by JavaScript after
    // the first paint, which flashed an unstyled page: a white background and
    // the 2996 px splash logo.
    expect(mainTs).not.toMatch(/import\s+['"]\.\/styles\.css['"]/);
  });
});
