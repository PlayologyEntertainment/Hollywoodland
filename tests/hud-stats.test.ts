// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { describeHud, LOW_ENERGY_AT } from '../src/app/HudStats';
import { createDefaultCareerState, type CareerState } from '../src/domain/CareerState';

const read = (path: string): string => (readFileSync(new URL(path, import.meta.url), 'utf8') as string).replace(/\r\n/g, '\n');
const css = read('../src/styles.css');
const indexHtml = read('../index.html');
const appShell = read('../src/app/AppShell.ts');
const createGame = read('../src/game/createGame.ts');

/** The declarations of the first rule whose selector is exactly `selector` (which starts a line). */
function rule(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`\\n${escaped} \\{([^}]*)\\}`))?.[1] ?? '';
}

function stateWith(changes: { day?: number; slot?: CareerState['time']['slot']; money?: number; energy?: number; reputation?: number }): CareerState {
  const base = createDefaultCareerState();
  return {
    ...base,
    time: { day: changes.day ?? base.time.day, slot: changes.slot ?? base.time.slot },
    resources: {
      money: changes.money ?? base.resources.money,
      energy: changes.energy ?? base.resources.energy,
      reputation: changes.reputation ?? base.resources.reputation,
    },
  };
}

describe('describeHud', () => {
  it('describes a new career: Day 1, a Monday morning, $12, full energy', () => {
    const hud = describeHud(createDefaultCareerState());
    expect(hud).toMatchObject({ dayNumber: 'Day 1', weekday: 'Monday', slotLabel: 'Morning', money: '$12' });
    expect(hud).toMatchObject({ energy: 100, energyLow: false });
  });

  it('still hands the Status panel the reputation, which is not shown on the picture', () => {
    expect(describeHud(stateWith({ reputation: 46 })).reputation).toBe(46);
  });

  it('counts the days and names the weekday and time of day as time passes', () => {
    const hud = describeHud(stateWith({ day: 3, slot: 'evening' }));
    expect(hud).toMatchObject({ dayNumber: 'Day 3', weekday: 'Wednesday', slotLabel: 'Evening' });
    expect(describeHud(stateWith({ day: 8, slot: 'afternoon' })).weekday).toBe('Monday');
  });

  it('flags low energy at the threshold and below, not above it', () => {
    expect(describeHud(stateWith({ energy: LOW_ENERGY_AT })).energyLow).toBe(true);
    expect(describeHud(stateWith({ energy: 0 })).energyLow).toBe(true);
    expect(describeHud(stateWith({ energy: LOW_ENERGY_AT + 1 })).energyLow).toBe(false);
  });

  it('gives screen readers the whole readout as one line, without reputation', () => {
    expect(describeHud(stateWith({ day: 2, slot: 'afternoon', money: 40, energy: 60, reputation: 5 })).spoken).toBe(
      'Day 2, Tuesday · Afternoon · $40 · Energy 60/100',
    );
  });
});

describe('the header', () => {
  const header = indexHtml.match(/<header id="status-bar"[\s\S]*?<\/header>/)?.[0] ?? '';

  it('has just the place on the left and the three view buttons on the right', () => {
    expect(header).toContain('Hollywood Boulevard');
    for (const id of ['film-mode', 'fullscreen', 'status-button']) expect(header, id).toContain(`id="${id}"`);
    expect(header).not.toContain('hud-stat');
  });

  it('no longer has the frame-rate readout, or reputation', () => {
    expect(header).not.toContain('fps');
    expect(header).not.toMatch(/reputation|>Rep</i);
    expect(appShell).not.toContain('startFpsMeter');
    expect(appShell).not.toContain('#fps-output');
    expect(appShell).not.toContain('#hud-reputation');
    expect(css).not.toContain('.fps-output');
    expect(indexHtml).toContain('id="status-reputation"');
  });

  it('is a solid black bar the same height as the footer', () => {
    expect(rule('.status-bar')).toMatch(/background: #000;/);
    expect(rule('.status-bar')).toContain('min-height: 3.5rem');
    expect(rule('.game-footer')).toContain('height: 3.5rem');
  });
});

describe('the career stats, in the row just under the header', () => {
  const overlay = indexHtml.match(/<section id="play-hud"[\s\S]*?<\/section>/)?.[0] ?? '';
  const top = overlay.match(/<div class="hud-top">[\s\S]*<\/div>\s*<\/section>/)?.[0] ?? overlay;

  it('are day, time, money and energy, in the same top row as the objective card', () => {
    expect(overlay).toContain('class="hud-top"');
    for (const id of ['hud-day-number', 'hud-weekday', 'hud-time', 'hud-money', 'hud-energy', 'hud-energy-stat']) {
      expect(top, id).toContain(`id="${id}"`);
    }
    expect(top.match(/class="hud-stat[ "]/g)).toHaveLength(4);
    expect(top.indexOf('class="objective-card"')).toBeLessThan(top.indexOf('class="hud-stats"'));
    expect(top).not.toMatch(/reputation|>Rep</i);
  });

  it('show the time of day as just the word, with no icon', () => {
    expect(top).toMatch(/<span id="hud-time" class="hud-value">/);
    expect(top).not.toContain('<svg');
    expect(top).not.toContain('hud-icon');
    expect(top).not.toContain('data-slot');
    expect(top).not.toContain('hud-time-stat');
    expect(css).not.toContain('.hud-icon');
    expect(css).not.toContain('data-slot');
    expect(appShell).not.toContain('dataset.slot');
  });

  it('still tell screen readers about changes, through a hidden live output', () => {
    expect(top).toMatch(/<output id="hud-quickstats" class="sr-only"/);
  });

  it('show energy as just the number, with no bar, which turns warm when energy is low', () => {
    expect(top).toMatch(/<span id="hud-energy" class="hud-value">/);
    expect(top).not.toContain('hud-bar');
    expect(top).not.toContain('--pct');
    expect(css).not.toContain('.hud-bar');
    expect(css).not.toContain('--pct');
    expect(appShell).not.toContain('hud-energy-bar');
    expect(appShell).not.toContain('--pct');
    // The number itself is the low-energy warning now.
    expect(css).toMatch(/\.hud-stat\[data-low="true"\] \.hud-value \{[^}]*color: #f0876a/);
    expect(appShell).toContain("dataset.low = String(hud.energyLow)");
  });

  it('are set in Limelight, on a soft dark plaque so they read over the sky', () => {
    expect(rule('.hud-stat')).toContain('font-family: var(--deco-font)');
    expect(rule('.hud-label')).toContain('font-family: var(--deco-font)');
    expect(rule('.hud-stats')).toContain('linear-gradient(90deg, transparent, rgb(13 10 12 / 82%)');
  });

  it('sit in the middle column of a three-column row, so they stay centred whatever the card\'s width', () => {
    expect(rule('.hud-top')).toContain('grid-template-columns: 1fr auto 1fr');
    expect(rule('.hud-stats')).toContain('grid-column: 2');
    // Close under the header: measured from the top of the picture, which is flush under it.
    expect(rule('.hud-top')).toMatch(/top: clamp\(/);
  });

  it('have their top level with the card\'s, but are only as tall as their own content', () => {
    // One row aligned to the top: neither box is stretched to the other's height.
    expect(rule('.hud-top')).toContain('align-items: start');
    expect(rule('.hud-top')).not.toContain('stretch');
    expect(rule('.hud-stats')).not.toMatch(/(?:align-self|height|min-height)\s*:/);
    expect(rule('.objective-card')).not.toContain('align-self');
    // A snug plaque: a little padding round the stats, not a tall band.
    expect(rule('.hud-stats')).toMatch(/padding: \.3rem /);
  });

  it('are simply spaced apart: no bullets or diamonds between them', () => {
    expect(css).not.toContain('.hud-stat + .hud-stat');
    expect(css).not.toMatch(/\.hud-stat[^{]*::(?:before|after)/);
    expect(rule('.hud-stat')).toMatch(/padding: [^;]*clamp\(/);
  });

  it('stay beside the card, more compactly as the picture narrows, and only stack on a phone-sized picture', () => {
    const compact = css.match(/@container stage \(max-width: 1180px\) \{([^@]*)\}\s*@container/)?.[1] ?? '';
    expect(compact).toContain('.hud-stat {');
    expect(compact).toContain('.objective-card {');
    // The compact tier does not stack them.
    expect(compact).not.toContain('grid-template-columns');
    expect(css).toMatch(/@container stage \(max-width: 820px\) \{[^@]*\.hud-top \{[^}]*grid-template-columns: 1fr;/);
  });
});

describe('the objective card', () => {
  const overlay = indexHtml.match(/<section id="play-hud"[\s\S]*?<\/section>/)?.[0] ?? '';

  it('is the semi-transparent card at the top left of the picture, over the sky and clear of the player', () => {
    const block = rule('.objective-card');
    expect(overlay).toContain('class="objective-card"');
    expect(block).toContain('justify-self: start');
    expect(block).toContain('linear-gradient(90deg, rgb(13 10 12 / 88%), rgb(13 10 12 / 38%), transparent)');
    // Nothing anchors it to the bottom, so it cannot slide down over the street.
    expect(block).not.toMatch(/(?<![-\w])bottom:/);
  });

  it('is transparent overlay, not a bar', () => {
    const block = rule('.play-hud');
    expect(block).toContain('position: absolute');
    expect(block).not.toContain('background');
    expect(block).toContain('pointer-events: none');
  });
});

describe('the picture, the stage, and the footer below it', () => {
  const stageHtml = indexHtml.match(/<div id="stage"[\s\S]*?<\/div>\s*<!-- Permanent footer/)?.[0] ?? '';
  const footer = indexHtml.match(/<footer id="game-footer"[\s\S]*?<\/footer>/)?.[0] ?? '';

  it('sits flush under the header at every window size: centred side to side only, never vertically', () => {
    expect(createGame).toContain('autoCenter: Phaser.Scale.CENTER_HORIZONTALLY');
    expect(createGame).not.toContain('CENTER_BOTH');
    expect(createGame).not.toContain('CENTER_VERTICALLY');
  });

  it('is fitted between the header and the footer', () => {
    expect(rule('#game-root')).toContain('inset: var(--header-h) 0 var(--footer-h)');
    expect(rule('#game-root')).toContain('height: auto');
    expect(css).toMatch(/\.game-frame \{[^}]*--footer-h: 0px/);
  });

  it('has a stage the size and place of that picture: 16:9, under the header, as wide as fits between the bars', () => {
    expect(css).toMatch(/--stage-w: min\(100cqw, calc\(\(100cqh - var\(--header-h\) - var\(--footer-h\)\) \* 16 \/ 9\)\);/);
    expect(css).toMatch(/\.game-frame \{[^}]*container-type: size/);
    const block = rule('.stage');
    expect(block).toContain('top: var(--header-h)');
    expect(block).toContain('width: var(--stage-w)');
    expect(block).toContain('aspect-ratio: 16 / 9');
    expect(block).toContain('left: 50%');
    expect(block).toContain('translateX(-50%)');
    // The stage must not swallow clicks meant for the game.
    expect(block).toContain('pointer-events: none');
    // The 16:9 is the game's own shape.
    expect(createGame).toMatch(/width: 1920,\s*height: 1080/);
  });

  it('holds the overlay (the objective card and the stats)', () => {
    expect(stageHtml).toContain('id="play-hud"');
    expect(stageHtml).toContain('class="objective-card"');
    expect(stageHtml).toContain('class="hud-stats"');
  });

  it('has a permanent footer directly below the picture, the same height as the header', () => {
    const block = rule('.game-footer');
    expect(footer).toContain('id="game-footer"');
    expect(block).toContain('top: calc(var(--header-h) + var(--stage-w) * 9 / 16)');
    expect(block).toContain('left: 0');
    expect(block).toContain('right: 0');
    expect(block).toMatch(/background: #000/);
    expect(block).toContain('height: 3.5rem');
    expect(css).toMatch(/\.game-footer\[hidden\] \{ display: none; \}/);
  });

  it('puts Wait on the left, the Playology logo at the very centre, and Menu on the right', () => {
    const wait = footer.indexOf('id="advance-time"');
    const logo = footer.indexOf('class="footer-logo"');
    const menu = footer.indexOf('id="return-menu"');
    expect(wait).toBeGreaterThan(-1);
    expect(logo).toBeGreaterThan(wait);
    expect(menu).toBeGreaterThan(logo);
    expect(footer).toContain('src="/assets/ui/playology-logo.webp"');
    expect(footer).toContain('alt="Playology Entertainment"');
    // A grid with equal columns either side of the logo keeps it dead centre whatever the buttons' widths.
    expect(rule('.game-footer')).toContain('grid-template-columns: 1fr auto 1fr');
    expect(css).toContain('.game-footer #advance-time { justify-self: start; }');
    expect(css).toContain('.game-footer #return-menu { justify-self: end; }');
  });

  it('has only Wait and Menu as buttons: Save and Export are gone', () => {
    expect(footer.match(/<button/g)).toHaveLength(2);
    expect(indexHtml).not.toContain('id="manual-save"');
    expect(indexHtml).not.toContain('id="export-save"');
    expect(appShell).not.toContain('#manual-save');
    expect(appShell).not.toContain('#export-save');
  });

  it('shows and hides with the game, and its height is published beside the header\'s', () => {
    expect(appShell).toMatch(/screens\.footer\.hidden = false/);
    expect(appShell).toMatch(/screens\.footer\.hidden = true/);
    expect(appShell).toContain("'--footer-h'");
  });

  it('saves on the way to the Main Menu instead, and no longer points players at the removed buttons', () => {
    expect(appShell).toContain('await this.options.onAutosave()');
    expect(appShell).not.toMatch(/use Save or Export|export a copy instead/);
  });
});

describe('the outline round the header and the footer', () => {
  const decoBorder = read('../src/ui/DecoBorder.ts');

  it('is mounted on both bars', () => {
    expect(appShell).toContain('mountDecoOutline(screens.statusBar)');
    expect(appShell).toContain('mountDecoOutline(screens.footer)');
  });

  it('is a plain layer over the whole bar, in gold, out of the way of clicks', () => {
    const block = rule('.deco-outline');
    expect(block).toContain('position: absolute');
    expect(block).toContain('inset: 0');
    expect(block).toMatch(/color: rgb\(216 173 88 \/ \d+%\)/);
    expect(block).toContain('pointer-events: none');
  });

  it('is 1px, 2px in from the edge, with a 4px square indent at each corner, by default', () => {
    expect(decoBorder).toMatch(/const gap = options\.gap \?\? 2;/);
    expect(decoBorder).toMatch(/const step = options\.step \?\? 4;/);
    expect(decoBorder).toMatch(/const strokeWidth = options\.strokeWidth \?\? 1;/);
  });

  it('replaces the earlier strips and border: none of that is left on the bars', () => {
    expect(css).not.toContain('.deco-rule');
    expect(appShell).not.toContain('mountDecoRule');
    expect(decoBorder).not.toContain('decoRuleSvg');
    expect(rule('.status-bar')).not.toContain('border-bottom');
    expect(css).not.toContain('.status-bar::after');
  });
});

describe('the floating notices: the entrance prompt and the toast', () => {
  const notices = indexHtml.match(/<div id="notices"[\s\S]*?<div id="toast"[^>]*><\/div>\s*<\/div>/)?.[0] ?? '';

  it('share one stack, the prompt above any toast', () => {
    expect(notices).toContain('id="interaction-prompt"');
    expect(notices).toContain('id="toast"');
    expect(notices.indexOf('id="interaction-prompt"')).toBeLessThan(notices.indexOf('id="toast"'));
    // Neither is anywhere else.
    expect(indexHtml.match(/id="interaction-prompt"/g)).toHaveLength(1);
    expect(indexHtml.match(/id="toast"/g)).toHaveLength(1);
  });

  it('keeps the toast a polite status message', () => {
    expect(notices).toMatch(/<div id="toast" class="toast" role="status" aria-live="polite" hidden>/);
    expect(appShell).toContain("assertElement('#toast', HTMLElement)");
  });

  it('sits at the top right under the header, level with the objective card', () => {
    const block = rule('.notices');
    expect(block).toContain('top: calc(var(--header-h) + clamp(.4rem, 1.2vh, .8rem))');
    // The card's top is the same clamp, measured from the picture's top, which is flush under the header.
    expect(rule('.hud-top')).toContain('top: clamp(.4rem, 1.2vh, .8rem)');
  });

  it('is the same distance in from the picture\'s right edge as the card is from its left, so they mirror', () => {
    expect(rule('.notices')).toContain('right: calc((100cqw - var(--stage-w)) / 2 + clamp(1rem, 3vw, 3rem))');
    expect(rule('.hud-top')).toContain('left: clamp(1rem, 3vw, 3rem)');
  });

  it('stacks its notices right-aligned, out of the way of clicks, and never wider than a third of the window', () => {
    const block = rule('.notices');
    expect(block).toContain('flex-direction: column');
    expect(block).toContain('align-items: flex-end');
    expect(block).toContain('pointer-events: none');
    expect(block).toContain('max-width: min(22rem, 34%)');
  });

  it('slides left of the Status panel when it is open, and down below the stats so it covers neither, and is drawn above the rest', () => {
    expect(css).toContain(".game-frame:has(#status-panel:not([hidden])) .notices { top: calc(var(--header-h) + clamp(.4rem, 1.2vh, .8rem) + 3.6rem); right: calc(min(100cqw, 29rem) + 1rem); }");
    const z = (selector: string): number => Number(rule(selector).match(/z-index: (\d+)/)?.[1]);
    expect(z('.notices')).toBeGreaterThan(z('.drawer'));
    expect(z('.notices')).toBeGreaterThan(z('.stage'));
  });

  it('are on rounded rectangles like the buttons, from one shared radius', () => {
    expect(css).toMatch(/:root \{[^}]*--button-radius: 0\.25rem;/);
    for (const selector of ['button', '.interaction-prompt', '.toast']) {
      expect(rule(selector), selector).toContain('border-radius: var(--button-radius)');
    }
  });

  it('no longer positions either notice itself: the old centred spots are gone', () => {
    for (const selector of ['.interaction-prompt', '.toast']) {
      const block = rule(selector);
      expect(block, selector).not.toMatch(/position: absolute|left: 50%|translateX|bottom:|top:/);
    }
  });
});
