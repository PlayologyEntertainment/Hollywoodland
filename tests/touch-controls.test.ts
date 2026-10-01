// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { padDirection } from '../src/app/TouchControls';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('the walking pad', () => {
  it('walks left or right once the finger leaves the middle, and stands still inside the dead zone', () => {
    expect(padDirection(-30, 12)).toBe(-1);
    expect(padDirection(30, 12)).toBe(1);
    expect(padDirection(5, 12)).toBe(0);
    expect(padDirection(-12, 12)).toBe(-1);
  });
});

describe('the touch controls in the page', () => {
  it('have a pad, a knob and an Interact button inside a container that starts hidden', () => {
    const block = read('../index.html').match(/<div id="touch-controls"[\s\S]*?<\/button>\s*<\/div>/)?.[0] ?? '';
    expect(block).toContain('hidden');
    for (const cls of ['touch-pad', 'touch-knob', 'touch-interact']) expect(block, cls).toContain(cls);
  });

  it('show only in touch mode', () => {
    const css = read('../src/styles.css');
    expect(css).toMatch(/\.touch-controls \{ display: none; \}/);
    expect(css).toContain('.touch .touch-controls:not([hidden])');
  });
});
