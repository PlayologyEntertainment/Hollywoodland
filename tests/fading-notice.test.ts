// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FadingNotice, NOTICE_FADE_MS } from '../src/app/FadingNotice';

const read = (path: string): string => (readFileSync(new URL(path, import.meta.url), 'utf8') as string).replace(/\r\n/g, '\n');
const css = read('../src/styles.css');
const appShell = read('../src/app/AppShell.ts');

function fakeElement(hidden = true) {
  const classes = new Set<string>();
  return {
    hidden,
    classList: { add: (name: string) => void classes.add(name), remove: (name: string) => void classes.delete(name) },
    has: (name: string) => classes.has(name),
  };
}

describe('FadingNotice', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('appears at once, with nothing fading', () => {
    const element = fakeElement();
    new FadingNotice(element).show();
    expect(element.hidden).toBe(false);
    expect(element.has('notice-fading')).toBe(false);
  });

  it('starts fading when hidden, stays in place while it fades, and only then really hides', () => {
    const element = fakeElement();
    const notice = new FadingNotice(element);
    notice.show();
    notice.hide();
    expect(element.has('notice-fading')).toBe(true);
    expect(element.hidden).toBe(false);
    vi.advanceTimersByTime(NOTICE_FADE_MS - 1);
    expect(element.hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(element.hidden).toBe(true);
    expect(element.has('notice-fading')).toBe(false);
  });

  it('is simply there again if it is shown while it fades, and is not hidden by the old fade', () => {
    const element = fakeElement();
    const notice = new FadingNotice(element);
    notice.show();
    notice.hide();
    vi.advanceTimersByTime(NOTICE_FADE_MS / 2);
    notice.show();
    expect(element.has('notice-fading')).toBe(false);
    vi.advanceTimersByTime(NOTICE_FADE_MS * 2);
    expect(element.hidden).toBe(false);
    // And it can fade away again afterwards.
    notice.hide();
    vi.advanceTimersByTime(NOTICE_FADE_MS);
    expect(element.hidden).toBe(true);
  });

  it('does not restart a fade that is already running when hidden again', () => {
    const element = fakeElement();
    const notice = new FadingNotice(element);
    notice.show();
    notice.hide();
    vi.advanceTimersByTime(NOTICE_FADE_MS / 2);
    notice.hide();
    vi.advanceTimersByTime(NOTICE_FADE_MS / 2);
    expect(element.hidden).toBe(true);
  });

  it('has nothing to fade when it is not showing', () => {
    const element = fakeElement(true);
    new FadingNotice(element).hide();
    expect(element.has('notice-fading')).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('can be taken away at once, cancelling any fade', () => {
    const element = fakeElement();
    const notice = new FadingNotice(element);
    notice.show();
    notice.hide();
    notice.hideNow();
    expect(element.hidden).toBe(true);
    expect(element.has('notice-fading')).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('the notices\' fade in the app', () => {
  it('is a CSS opacity transition that is only on while fading, so appearing is instant', () => {
    const block = css.match(/\n\.notice-fading \{([^}]*)\}/)?.[1] ?? '';
    expect(block).toContain('opacity: 0');
    expect(block).toContain(`transition: opacity ${NOTICE_FADE_MS}ms`);
    // Nothing on the notices themselves transitions, or they would fade in too.
    for (const selector of ['.notices', '.interaction-prompt', '.toast']) {
      const own = css.match(new RegExp(`\\n${selector.replace('.', '\\.')} \\{([^}]*)\\}`))?.[1] ?? '';
      expect(own, selector).not.toContain('transition');
    }
  });

  it('is used for both the entrance prompt and the toast', () => {
    expect(appShell).toContain("new FadingNotice(assertElement('#interaction-prompt', HTMLElement))");
    expect(appShell).toContain("new FadingNotice(assertElement('#toast', HTMLElement))");
    expect(appShell).toContain('this.toastNotice.hide()');
    expect(appShell).toContain('this.promptNotice.hide()');
  });

  it('keeps the prompt\'s words while it fades, and takes it away at once on the way to the Main Menu', () => {
    const setPrompt = appShell.match(/private setInteractionPrompt[\s\S]*?\n  \}/)?.[0] ?? '';
    // The empty label reported when there is nothing to enter is not written while hiding.
    expect(setPrompt.indexOf('this.promptNotice.hide()')).toBeLessThan(setPrompt.indexOf('textContent = label'));
    expect(appShell).toContain('this.promptNotice.hideNow()');
  });
});
