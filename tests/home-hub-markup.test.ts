// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('home hub dialog', () => {
  it('provides a JS-populated skeleton for the housing, assignment, and away-summary renderers', () => {
    const dialog = indexHtml.match(/<dialog id="home-hub-dialog"[\s\S]*?<\/dialog>/)?.[0];
    expect(dialog).toContain('id="home-hub-away-summary"');
    expect(dialog).toContain('id="home-hub-away-headline"');
    expect(dialog).toContain('id="home-hub-away-rewards"');
    expect(dialog).toContain('id="home-hub-housing-tier"');
    expect(dialog).toContain('id="home-hub-upgrade-housing"');
    expect(dialog).toContain('id="home-hub-active-assignment"');
    expect(dialog).toContain('id="home-hub-active-assignment-label"');
    expect(dialog).toContain('id="home-hub-assignment-list"');
    expect(dialog).toContain('id="home-hub-talk-landlady"');
    expect(dialog).toContain('id="home-hub-close"');
  });

  it('uses the scene layout, with a background element the Home Menu fills with the room image', () => {
    const dialog = indexHtml.match(/<dialog id="home-hub-dialog"[\s\S]*?<\/dialog>/)?.[0];
    expect(dialog).toContain('has-scene-art');
    expect(dialog).toContain('id="home-hub-background"');
    expect(dialog).toMatch(/class="story-card home-hub-card scene-panel"/);
  });
});
