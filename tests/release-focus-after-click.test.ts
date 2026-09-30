// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { releaseFocusAfterMouseClick, type FocusReleaseClick, type FocusReleaseContainer } from '../src/app/ReleaseFocusAfterClick';

const read = (path: string): string => readFileSync(new URL(path, import.meta.url), 'utf8') as string;

function setup(): { click(event: FocusReleaseClick): void; button: { blurred: number; blur(): void }; container: FocusReleaseContainer } {
  let listener: ((event: FocusReleaseClick) => void) | undefined;
  const button = {
    blurred: 0,
    blur() {
      this.blurred += 1;
    },
  };
  const container: FocusReleaseContainer = {
    addEventListener: (_type, handler) => {
      listener = handler;
    },
    contains: (other) => other === button,
  };
  releaseFocusAfterMouseClick(container);
  return { click: (event) => listener?.(event), button, container };
}

const on = (button: { blur(): void }, detail: number): FocusReleaseClick => ({ detail, target: { closest: () => button } });

describe('releaseFocusAfterMouseClick', () => {
  it('blurs the clicked button after a mouse click', () => {
    const { click, button } = setup();
    click(on(button, 1));
    expect(button.blurred).toBe(1);
  });

  it('leaves a keyboard-made click alone, so tabbing keeps its focus ring', () => {
    const { click, button } = setup();
    click(on(button, 0));
    expect(button.blurred).toBe(0);
  });

  it('ignores a click that is not on a button, or on one outside the container', () => {
    const { click, button } = setup();
    click({ detail: 1, target: { closest: () => null } });
    click({ detail: 1, target: null });
    click({ detail: 1, target: { closest: () => ({ blur: () => button.blur() }) } }); // a button the container does not hold
    expect(button.blurred).toBe(0);
  });

  it('is wired to the header and the footer', () => {
    const shell = read('../src/app/AppShell.ts');
    expect(shell).toContain("releaseFocusAfterMouseClick(assertElement('#status-bar', HTMLElement))");
    expect(shell).toContain("releaseFocusAfterMouseClick(assertElement('#game-footer', HTMLElement))");
  });
});
