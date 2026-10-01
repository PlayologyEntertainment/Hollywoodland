import { describe, expect, it, vi } from 'vitest';

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

  public dispatchEvent(type: 'blur'): void {
    for (const listener of this.listeners.get(type) ?? []) listener({ type } as unknown as Event);
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

describe('input controller: on-screen touch controls', () => {
  it('holds an action like a key, and only while gameplay is active', () => {
    const input = new InputController(new FakeWindow());
    input.setVirtualDown('moveRight', true);
    expect(input.isDown('moveRight')).toBe(false);
    input.setGameplayActive(true);
    input.setVirtualDown('moveRight', true);
    expect(input.isDown('moveRight')).toBe(true);
    input.setVirtualDown('moveRight', false);
    expect(input.isDown('moveRight')).toBe(false);
  });

  it('reports one press per touch, like a key, even when the tap is over before the game looks', () => {
    const input = new InputController(new FakeWindow());
    input.setGameplayActive(true);
    input.setVirtualDown('interact', true);
    input.setVirtualDown('interact', true);
    expect(input.consumePress('interact')).toBe(true);
    expect(input.consumePress('interact')).toBe(false);
    input.setVirtualDown('interact', false);
    input.setVirtualDown('interact', true);
    input.setVirtualDown('interact', false);
    expect(input.consumePress('interact')).toBe(true);
  });

  it('drops a released press that nobody looked at in time, so it cannot fire later', () => {
    const input = new InputController(new FakeWindow());
    input.setGameplayActive(true);
    let now = 1000;
    const spy = vi.spyOn(performance, 'now').mockImplementation(() => now);
    input.setVirtualDown('interact', true);
    input.setVirtualDown('interact', false);
    now += 500;
    expect(input.consumePress('interact')).toBe(false);
    spy.mockRestore();
  });

  it('lets go of everything when gameplay switches off, and says so', () => {
    const input = new InputController(new FakeWindow());
    const seen: boolean[] = [];
    input.onGameplayActiveChange((active) => seen.push(active));
    input.setGameplayActive(true);
    input.setVirtualDown('moveLeft', true);
    input.setGameplayActive(false);
    input.setGameplayActive(true);
    expect(input.isDown('moveLeft')).toBe(false);
    expect(seen).toEqual([true, false, true]);
  });
});

describe('input controller: losing focus', () => {
  it('lets go of held keys when the page loses focus, so nothing keeps walking after another tab was in front', () => {
    const win = new FakeWindow();
    const input = new InputController(win);
    input.setGameplayActive(true);
    press(win, 'ArrowRight');
    input.setVirtualDown('moveLeft', true);
    expect(input.isDown('moveRight')).toBe(true);
    win.dispatchEvent('blur');
    expect(input.isDown('moveRight')).toBe(false);
    expect(input.isDown('moveLeft')).toBe(false);
    expect(input.consumePress('moveRight')).toBe(false);
  });
});
