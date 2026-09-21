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
  });

  it('builds the chapter page for a staged reveal, with no button and every element timed', () => {
    const chapter = indexHtml.match(/<section id="chapter-title"[\s\S]*?<\/section>/)?.[0] ?? '';
    expect(chapter).toContain('tabindex="-1"');
    expect(chapter).not.toContain('<button');
    expect(chapter).toContain('aria-describedby="chapter-hint"');
    const times = [...chapter.matchAll(/data-reveal="(\d+)"/g)].map((match) => Number(match[1]));
    expect(times.length).toBeGreaterThanOrEqual(6);
    expect(times[0]).toBe(0);
    // The hint on how to move on comes last, after all the copy.
    expect(Number(chapter.match(/id="chapter-hint"[^>]*data-reveal="(\d+)"/)?.[1])).toBe(Math.max(...times));
  });

  it('sets the chapter page in Limelight, except the intro paragraphs, which use the plain display serif', () => {
    const block = css.slice(css.indexOf('.chapter-title {'), css.indexOf('.chapter-hint'));
    expect(block).toMatch(/\.chapter-title \{[^}]*font-family: var\(--deco-font\)/);
    // The one other face on the page is the intro paragraphs'.
    expect(block).toMatch(/\.chapter-intro p \{[^}]*font-family: var\(--display-font\)/);
    expect([...block.matchAll(/font-family:\s*([^;]+);/g)].map((match) => match[1])).toEqual(['var(--deco-font)', 'var(--display-font)']);
  });

  it('never shows a scrollbar on the chapter page, and sizes its text from the window height so it fits a short window', () => {
    const body = css.match(/\.chapter-title-body \{[^}]*\}/)?.[0] ?? '';
    expect(body).toContain('scrollbar-width: none');
    expect(css).toContain('.chapter-title-body::-webkit-scrollbar { display: none; }');
    expect(body).toMatch(/padding: clamp\([^)]*vh/);
    expect(css).toMatch(/\.chapter-title-body \{[^}]*--intro-size: clamp\([^;]*vh/);
    expect(css).toMatch(/\.chapter-intro p \{[^}]*font-size: var\(--intro-size\)/);
  });

  it('leaves room above and below the chapter text, inside the border', () => {
    expect(css).toMatch(/\.chapter-title \{[^}]*padding-block: clamp\([^)]*vh/);
  });

  it('puts two blank lines of the intro text above the intro and above the hint', () => {
    // A line is 1.6 times the intro size, so two are 3.2 times it, less the ordinary gap already between the items.
    expect(css).toMatch(/\.chapter-title-body \{[^}]*--blank-lines: calc\(var\(--intro-size\) \* 3\.2 - var\(--chapter-gap\)\)/);
    expect(css).toMatch(/\.chapter-intro p \{[^}]*line-height: 1\.6/);
    expect(css).toMatch(/\.chapter-intro \{[^}]*margin-top: var\(--blank-lines\)/);
    expect(css).toMatch(/\.chapter-hint \{[^}]*margin: var\(--blank-lines\) 0 0/);
    expect(css).toMatch(/\.chapter-title-body \{[^}]*gap: var\(--chapter-gap\)/);
  });

  it('keeps the CSS fade the same length as FADE_MS', () => {
    expect(css).toMatch(new RegExp(`\\.screen-fade \\{[^}]*transition: opacity var\\(--fade-in-ms, ${FADE_MS}ms\\)`));
    expect(css).toMatch(new RegExp(`\\.screen-fade\\.active \\{[^}]*transition-duration: ${FADE_MS}ms`));
  });
});
