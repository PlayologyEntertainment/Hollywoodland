// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const scene = readFileSync(new URL('../src/game/scenes/BoulevardSpikeScene.ts', import.meta.url), 'utf8') as string;
const appShell = readFileSync(new URL('../src/app/AppShell.ts', import.meta.url), 'utf8') as string;
const domainEventBus = readFileSync(new URL('../src/domain/DomainEventBus.ts', import.meta.url), 'utf8') as string;

describe('click-to-move', () => {
  it('produces the same -1/0/1 direction keyboard input always has, so downstream code needs no changes', () => {
    expect(scene).toContain('private currentDirection(): number {');
    expect(scene).toMatch(/const direction = this\.currentDirection\(\);/);
  });

  it('keyboard input always wins and cancels a pending click-walk', () => {
    const method = scene.slice(scene.indexOf('private currentDirection(): number {'));
    expect(method).toMatch(/if \(keyboardDirection !== 0\) \{\s*this\.clickTargetX = undefined;\s*return keyboardDirection;/);
  });

  it('a new click always overwrites the current target, redirecting immediately', () => {
    expect(scene).toContain('this.clickTargetX = Phaser.Math.Clamp(worldPoint.x, 110, this.worldWidth - 110);');
  });

  it('arriving within the threshold clears the target and stops, rather than oscillating around it', () => {
    expect(scene).toContain('const CLICK_ARRIVAL_THRESHOLD = 6;');
    expect(scene).toMatch(/if \(Math\.abs\(distanceToTarget\) < CLICK_ARRIVAL_THRESHOLD\) \{\s*this\.clickTargetX = undefined;\s*return 0;/);
  });

  it('converts the click to world space via the camera, accounting for scroll/deadzone/follow', () => {
    expect(scene).toContain('this.cameras.main.getWorldPoint(pointer.x, pointer.y)');
  });

  it('ignores clicks while the Career panel is open, but not any other reason', () => {
    expect(scene).toMatch(/onPointerDown = \(pointer: Phaser\.Input\.Pointer\): void => \{\s*if \(this\.statusPanelOpen\) return;/);
  });

  it('never auto-enters a location on arrival — only the interact key still calls onEnter', () => {
    expect(scene).not.toMatch(/clickTargetX[\s\S]{0,200}onEnter\(\)/);
    expect(scene).toMatch(/consumePress\('interact'\)\) \{\s*nearest\.onEnter\(\);/);
  });

  it('subscribes and unsubscribes the pointerdown listener alongside every other domain-event subscription', () => {
    expect(scene).toContain("this.input.on('pointerdown', this.onPointerDown);");
    expect(scene).toContain("this.input.off('pointerdown', this.onPointerDown);");
  });
});

describe('the Career panel telling the Boulevard when it opens/closes', () => {
  it('is a plain payload on the shared domain event bus, not read directly from the DOM by the scene', () => {
    expect(domainEventBus).toContain("readonly 'status-panel-visibility-changed': StatusPanelVisibilityChangedPayload;");
    expect(domainEventBus).toMatch(/export interface StatusPanelVisibilityChangedPayload \{\s*readonly open: boolean;/);
  });

  it('AppShell emits it from both openStatus and closeStatus', () => {
    const openMethod = appShell.slice(appShell.indexOf('private openStatus('), appShell.indexOf('private closeStatus('));
    expect(openMethod).toContain("this.options.domainEvents.emit('status-panel-visibility-changed', { open: true });");
    const closeMethod = appShell.slice(appShell.indexOf('private closeStatus('));
    expect(closeMethod.slice(0, 400)).toContain("this.options.domainEvents.emit('status-panel-visibility-changed', { open: false });");
  });
});
