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

describe('the map on touch', () => {
  it('needs a second tap on the same place to travel, with a hint in every language', () => {
    expect(read('../src/app/BusMap.ts')).toContain("document.documentElement.classList.contains('touch') && this.selected !== id");
    for (const code of ['en', 'de', 'es', 'fr', 'pt-BR']) expect(read(`../src/locales/${code}.json`), code).toContain('"busMap.tapAgain"');
  });
});

describe('small-screen rules for the title, splash, creator and Career panel', () => {
  const css = read('../src/styles.css');

  it('size the title slate by the screen height too on a short landscape screen, so its logo and menu are not cut off', () => {
    expect(css).toMatch(/@media \(orientation: landscape\) and \(max-height: 620px\) \{\s*\.title-panel \{ --slate-w: min\(calc\(100vw - 1rem\), calc\(\(100dvh - 1rem\) \* 1\.4761\)\); max-height: none; overflow: visible; \}/);
  });

  it('make the Career panel a full window above the HUD on small screens', () => {
    expect(css).toMatch(/@media \(max-width: 640px\), \(orientation: landscape\) and \(max-height: 560px\) \{\s*\.drawer \{ z-index: 30; inset: 0;/);
  });
});

describe('the Playology logo link', () => {
  const html = read('../index.html');
  const link = html.match(/<a id="footer-logo-link"[^>]*>/)?.[0] ?? '';

  it('opens the company site in a new tab without handing it the game window', () => {
    expect(link).toContain('href="https://www.playologyentertainment.com/index.html"');
    expect(link).toContain('target="_blank"');
    expect(link).toContain('rel="noopener noreferrer"');
    expect(link).toContain('aria-label=');
    expect(html).toMatch(/<a id="footer-logo-link"[\s\S]*?<img class="footer-logo"[\s\S]*?<\/a>/);
  });

  it('is labelled in every language, goes to Settings on phones, and lets go of focus after a click', () => {
    for (const code of ['en', 'de', 'es', 'fr', 'pt-BR']) expect(read(`../src/locales/${code}.json`), code).toContain('"gameFooter.playologyLink"');
    const shell = read('../src/app/AppShell.ts');
    expect(shell).toContain("'#footer-logo-link'");
    expect(shell).toContain('logoLink.blur()');
  });
});
