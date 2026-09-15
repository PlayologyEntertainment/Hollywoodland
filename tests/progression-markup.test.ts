// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('status panel progression log', () => {
  it('provides a JS-populated skeleton for the level, XP bar, and talent list renderer', () => {
    const panel = indexHtml.match(/<aside id="status-panel"[\s\S]*?<\/aside>/)?.[0];
    expect(panel).toContain('id="status-level"');
    expect(panel).toContain('id="status-xp-bar"');
    expect(panel).toContain('id="status-xp-fill"');
    expect(panel).toContain('id="status-xp-label"');
    expect(panel).toContain('id="status-talents-list"');
  });
});
