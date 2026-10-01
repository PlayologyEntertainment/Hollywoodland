// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { applyTouchMode, PHONE_LANDSCAPE_QUERY, TOUCH_QUERY } from '../src/app/TouchMode';

function fakeMedia(initial: boolean) {
  const listeners: Array<(event: Event) => void> = [];
  const query = {
    matches: initial,
    addEventListener: (_type: string, listener: (event: Event) => void) => void listeners.push(listener),
  };
  return { query, change: (matches: boolean) => { query.matches = matches; listeners.forEach((l) => l(new Event("change"))); } };
}

function fakeRoot() {
  const classes = new Set<string>();
  return {
    classes,
    classList: { toggle: (name: string, on: boolean) => { if (on) classes.add(name); else classes.delete(name); return on; } } as unknown as DOMTokenList,
  };
}

describe('touch mode', () => {
  it('marks the page touch when the main pointer is coarse, and follows later changes', () => {
    const media = fakeMedia(true);
    const root = fakeRoot();
    let asked = '';
    applyTouchMode(root, (q) => { asked = q; return media.query; });
    expect(asked).toBe(TOUCH_QUERY);
    expect(root.classes.has('touch')).toBe(true);
    media.change(false);
    expect(root.classes.has('touch')).toBe(false);
  });

  it('leaves a mouse-driven page alone', () => {
    const root = fakeRoot();
    applyTouchMode(root, () => fakeMedia(false).query);
    expect(root.classes.has('touch')).toBe(false);
  });
});

describe('the phone layout', () => {
  it('writes the same condition in the stylesheet as in code', () => {
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
    expect(css).toContain(`@media ${PHONE_LANDSCAPE_QUERY} {`);
  });

  it('can be forced on or off from the address', () => {
    const on = fakeRoot();
    applyTouchMode(on, () => fakeMedia(false).query, '?touch=1');
    expect(on.classes.has('touch')).toBe(true);
    const off = fakeRoot();
    applyTouchMode(off, () => fakeMedia(true).query, '?touch=0');
    expect(off.classes.has('touch')).toBe(false);
  });
});
