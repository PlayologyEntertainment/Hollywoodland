// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const read = (path: string): string =>
  (readFileSync(new URL(path, import.meta.url), 'utf8') as string).replace(/\r\n/g, '\n');
const css = read('../src/styles.css');
const indexHtml = read('../index.html');
const appShell = read('../src/app/AppShell.ts');

/** The declaration block of the first rule whose selector is exactly `selector`. */
function rule(selector: string): string {
  const start = css.indexOf(`\n${selector} {`);
  if (start < 0) throw new Error(`No rule for ${selector}`);
  const open = css.indexOf('{', start);
  return css.slice(open + 1, css.indexOf('}', open));
}

describe('the black status header', () => {
  it('is solid black, not a gradient over the game, so it looks the same in fullscreen', () => {
    const block = rule('.status-bar');
    expect(block).toMatch(/background:\s*#000\s*;/);
    expect(block).not.toContain('gradient');
  });

  it('gets its own row: the game area starts below it (and above the footer) and is not 100% tall', () => {
    const block = rule('#game-root');
    expect(block).toContain('inset: var(--header-h) 0 var(--footer-h)');
    // The shared `height: 100%` rule would otherwise win over `bottom: 0` and push the game 54 px past the frame.
    expect(block).toContain('height: auto');
  });

  it('publishes its height (and the footer\'s) to the game frame before the game boots, and re-fits Phaser when it changes', () => {
    expect(appShell).toContain("frame.style.setProperty(name, value)");
    expect(appShell).toContain("['--header-h', header]");
    expect(appShell).toContain("['--footer-h', footer]");
    expect(appShell).toMatch(/screens\.statusBar\.hidden = false;[\s\S]*?this\.syncBarHeights\(\);[\s\S]*?this\.options\.onStart\(state\)/);
    expect(appShell).toContain('this.game?.scale.refresh()');
  });
});

describe('the Status (Your Career) panel', () => {
  it('starts below the header and does not scroll itself, so its border stays fixed', () => {
    const block = rule('.drawer');
    expect(block).toContain('top: var(--header-h)');
    expect(block).toContain('bottom: 0');
    expect(block).not.toContain('overflow');
  });

  it('scrolls its body with a scroll bar', () => {
    const block = rule('.drawer-scroll');
    expect(block).toContain('overflow-y: auto');
    expect(block).toContain('min-height: 0');
  });

  it('keeps its title row and close button outside the scrolling body', () => {
    const panel = indexHtml.match(/<aside id="status-panel"[\s\S]*?<\/aside>/)?.[0] ?? '';
    const headingAt = panel.indexOf('class="drawer-heading"');
    const scrollAt = panel.indexOf('class="drawer-scroll"');
    expect(headingAt).toBeGreaterThan(-1);
    expect(scrollAt).toBeGreaterThan(headingAt);
    expect(panel.indexOf('id="close-status"')).toBeLessThan(scrollAt);
    for (const id of ['status-quests-list', 'status-relationships-list', 'status-talents-list', 'status-inventory-list']) {
      expect(panel.indexOf(`id="${id}"`), id).toBeGreaterThan(scrollAt);
    }
  });

  it('can still be closed: the display rule does not override the hidden attribute', () => {
    // `.drawer` sets `display: flex`, which beats the browser's [hidden] rule, so a closed panel
    // stayed on screen (rendered over everything) unless this rule restores it.
    expect(css).toMatch(/\.drawer\[hidden\]\s*\{\s*display:\s*none;\s*\}/);
  });

  it('is toggled by the Status button, which stays visible below the header while it is open', () => {
    expect(appShell).toMatch(/statusButton\.addEventListener\('click', \(\) =>\s*statusPanel\.hidden \? this\.openStatus\(statusPanel, statusButton\) : this\.closeStatus\(statusPanel, statusButton\)/);
  });
});
