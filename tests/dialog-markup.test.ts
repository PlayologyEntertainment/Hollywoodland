// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('casting-office dialog', () => {
  it('uses native dialog form submission so the response button closes the modal', () => {
    const dialog = indexHtml.match(/<dialog id="interaction-dialog"[\s\S]*?<\/dialog>/)?.[0];
    expect(dialog).toContain('<form method="dialog" class="story-card">');
    expect(dialog).toContain('value="close"');
  });
});
