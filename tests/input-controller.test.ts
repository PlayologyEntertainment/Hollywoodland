import { describe, expect, it } from 'vitest';

import { DEFAULT_BINDINGS, InputController } from '../src/input/InputController';

class FakeWindow implements Pick<Window, 'addEventListener' | 'removeEventListener'> {
  private readonly listeners = new Map<string, Set<(event: Event) => void>>();

  public addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (typeof listener !== 'function') return;
    const set = this.listeners.get(type) ?? new Set<(event: Event) => void>();
    set.add(listener as (event: Event) => void);
    this.listeners.set(type, set);
  }

  public removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    if (typeof listener !== 'function') return;
    this.listeners.get(type)?.delete(listener as (event: Event) => void);
  }

  public dispatch(type: 'keydown' | 'keyup', code: string, repeat = false): void {
    const event = { code, repeat, preventDefault: () => {} } as unknown as KeyboardEvent;
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

function press(window: FakeWindow, code: string, repeat = false): void {
  window.dispatch('keydown', code, repeat);
}

function release(window: FakeWindow, code: string): void {
  window.dispatch('keyup', code);
}

describe('input controller', () => {
  it('reports an action down only while gameplay is active', () => {
    const window = new FakeWindow();
    const input = new InputController(window);
    press(window, 'ArrowLeft');
    expect(input.isDown('moveLeft')).toBe(false);
    input.setGameplayActive(true);
    press(window, 'ArrowLeft');
    expect(input.isDown('moveLeft')).toBe(true);
  });

  it('matches any code bound to an action', () => {
    const window = new FakeWindow();
    const input = new InputController(window);
    input.setGameplayActive(true);
    press(window, 'KeyD');
    expect(input.isDown('moveRight')).toBe(true);
  });

  it('clears a held key on keyup', () => {
    const window = new FakeWindow();
    const input = new InputController(window);
    input.setGameplayActive(true);
    press(window, 'ArrowLeft');
    release(window, 'ArrowLeft');
    expect(input.isDown('moveLeft')).toBe(false);
  });

  it('consumes a just-pressed action exactly once', () => {
    const window = new FakeWindow();
    const input = new InputController(window);
    input.setGameplayActive(true);
    press(window, 'KeyE');
    expect(input.consumePress('interact')).toBe(true);
    expect(input.consumePress('interact')).toBe(false);
  });

  it('does not re-arm a just-pressed action on a repeat keydown', () => {
    const window = new FakeWindow();
    const input = new InputController(window);
    input.setGameplayActive(true);
    press(window, 'KeyE');
    expect(input.consumePress('interact')).toBe(true);
    press(window, 'KeyE', true);
    expect(input.consumePress('interact')).toBe(false);
  });

  it('drops held and pending presses when gameplay is deactivated', () => {
    const window = new FakeWindow();
    const input = new InputController(window);
    input.setGameplayActive(true);
    press(window, 'ArrowLeft');
    input.setGameplayActive(false);
    expect(input.isDown('moveLeft')).toBe(false);
    input.setGameplayActive(true);
    expect(input.isDown('moveLeft')).toBe(false);
    expect(input.consumePress('moveLeft')).toBe(false);
  });

  it('stops reacting to key events once destroyed', () => {
    const window = new FakeWindow();
    const input = new InputController(window);
    input.setGameplayActive(true);
    input.destroy();
    press(window, 'ArrowLeft');
    expect(input.isDown('moveLeft')).toBe(false);
  });

  it('honors custom bindings instead of the defaults', () => {
    const window = new FakeWindow();
    const input = new InputController(window, { ...DEFAULT_BINDINGS, moveLeft: ['KeyQ'] });
    input.setGameplayActive(true);
    press(window, 'ArrowLeft');
    expect(input.isDown('moveLeft')).toBe(false);
    press(window, 'KeyQ');
    expect(input.isDown('moveLeft')).toBe(true);
  });
});
