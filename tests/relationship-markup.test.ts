// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('status panel relationship log', () => {
  it('provides a JS-populated skeleton for the relationship renderer', () => {
    const panel = indexHtml.match(/<aside id="status-panel"[\s\S]*?<\/aside>/)?.[0];
    expect(panel).toContain('id="status-relationships-list"');
  });
});
