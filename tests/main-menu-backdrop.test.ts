// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8') as string;

describe('main menu backdrop', () => {
  const backdrop = indexHtml.match(/<div id="menu-backdrop"[^>]*>/)?.[0] ?? '';
  const image = backdrop.match(/url\('%BASE_URL%([^']+)'\)/)?.[1] ?? '';

  it('is the soundstage art (art/Hollywoodland_Location_Soundstage.png, shipped as the soundstage location image)', () => {
    expect(image).toBe('assets/locations/soundstage.webp');
  });

  it('points at an image that is really in the build', () => {
    expect(existsSync(new URL(`../public/${image}`, import.meta.url))).toBe(true);
  });
});
