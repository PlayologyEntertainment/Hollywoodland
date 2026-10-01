import { describe, expect, it } from 'vitest';

import { applyTouchMode, TOUCH_QUERY } from '../src/app/TouchMode';

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
