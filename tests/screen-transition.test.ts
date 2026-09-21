// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { FADE_MS, ScreenTransition } from '../src/app/ScreenTransition';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

function makeOverlay(log: string[]) {
  return {
    classList: {
      add: (name: string) => log.push(`add ${name}`),
      remove: (name: string) => log.push(`remove ${name}`),
    },
    style: { setProperty: (name: string, value: string) => log.push(`set ${name} ${value}`) },
  };
}

describe('ScreenTransition', () => {
  it('fades to black, swaps while black, then fades back in', async () => {
    const log: string[] = [];
    const transition = new ScreenTransition(makeOverlay(log), async (ms) => { log.push(`wait ${ms}`); }, () => false);
    const ran = await transition.run(() => { log.push('swap'); });
    expect(ran).toBe(true);
    expect(log).toEqual(['add active', `wait ${FADE_MS}`, 'swap', `set --fade-in-ms ${FADE_MS}ms`, 'remove active', `wait ${FADE_MS}`]);
  });

  it('can make just the fade back in longer', async () => {
    const log: string[] = [];
    const transition = new ScreenTransition(makeOverlay(log), async (ms) => { log.push(`wait ${ms}`); }, () => false);
    await transition.run(() => undefined, { fadeInMs: FADE_MS * 2 });
    expect(log).toEqual(['add active', `wait ${FADE_MS}`, `set --fade-in-ms ${FADE_MS * 2}ms`, 'remove active', `wait ${FADE_MS * 2}`]);
  });

  it('stays black until an async swap settles', async () => {
    const log: string[] = [];
    const transition = new ScreenTransition(makeOverlay(log), async () => undefined, () => false);
    await transition.run(async () => {
      log.push('loading');
      await Promise.resolve();
      log.push('loaded');
    });
    expect(log).toEqual(['add active', 'loading', 'loaded', `set --fade-in-ms ${FADE_MS}ms`, 'remove active']);
  });

  it('ignores a second request while one is running', async () => {
    const log: string[] = [];
    let release: () => void = () => undefined;
    const transition = new ScreenTransition(makeOverlay(log), async () => undefined, () => false);
    const first = transition.run(() => new Promise<void>((resolve) => { release = resolve; }));
    await Promise.resolve();
    expect(transition.isRunning).toBe(true);
    expect(await transition.run(() => { log.push('second swap'); })).toBe(false);
    release();
    expect(await first).toBe(true);
    expect(log).not.toContain('second swap');
    expect(transition.isRunning).toBe(false);
  });

  it('brings the overlay back down and frees the transition when the swap throws', async () => {
    const log: string[] = [];
    const transition = new ScreenTransition(makeOverlay(log), async () => undefined, () => false);
    await expect(transition.run(() => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(log).toContain('remove active');
    expect(transition.isRunning).toBe(false);
  });

  it('skips the waits under reduced motion', async () => {
    const waits: number[] = [];
    const transition = new ScreenTransition(makeOverlay([]), async (ms) => { waits.push(ms); }, () => true);
    await transition.run(() => undefined);
    expect(waits).toEqual([]);
  });
});

describe('screen fade markup', () => {
  it('has the fade overlay and a placeholder Chapter 1 page the shell can drive', () => {
    expect(indexHtml).toContain('id="screen-fade"');
    const chapter = indexHtml.match(/<section id="chapter-title"[\s\S]*?<\/section>/)?.[0];
    expect(chapter).toContain('hidden');
    expect(chapter).toContain('Chapter 1');
    expect(chapter).toContain('id="chapter-continue"');
  });

  it('keeps the CSS fade the same length as FADE_MS', () => {
    expect(css).toMatch(new RegExp(`\\.screen-fade \\{[^}]*transition: opacity var\\(--fade-in-ms, ${FADE_MS}ms\\)`));
    expect(css).toMatch(new RegExp(`\\.screen-fade\\.active \\{[^}]*transition-duration: ${FADE_MS}ms`));
  });
});
