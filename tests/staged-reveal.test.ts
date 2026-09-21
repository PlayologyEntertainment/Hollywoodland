import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StagedReveal } from '../src/app/StagedReveal';

describe('StagedReveal', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function make(times: readonly number[]) {
    const shown: number[] = [];
    let completed = 0;
    const reveal = new StagedReveal(
      times.map((atMs) => ({ atMs, reveal: () => shown.push(atMs) })),
      () => { completed += 1; },
    );
    return { reveal, shown, completions: () => completed };
  }

  it('reveals each step at its own time, and completes after the last', () => {
    const { reveal, shown, completions } = make([0, 800, 2000]);
    reveal.start();
    vi.advanceTimersByTime(0);
    expect(shown).toEqual([0]);
    vi.advanceTimersByTime(800);
    expect(shown).toEqual([0, 800]);
    expect(reveal.isComplete).toBe(false);
    expect(completions()).toBe(0);
    vi.advanceTimersByTime(1200);
    expect(shown).toEqual([0, 800, 2000]);
    expect(reveal.isComplete).toBe(true);
    expect(completions()).toBe(1);
  });

  it('skip shows everything left at once, completes once, and cancels the clock', () => {
    const { reveal, shown, completions } = make([0, 800, 2000]);
    reveal.start();
    vi.advanceTimersByTime(900);
    reveal.skip();
    expect(shown).toEqual([0, 800, 2000]);
    expect(completions()).toBe(1);
    vi.advanceTimersByTime(5000);
    expect(shown).toEqual([0, 800, 2000]);
    expect(completions()).toBe(1);
  });

  it('can skip before it has been started, and skip twice without repeating', () => {
    const { reveal, shown, completions } = make([0, 500]);
    reveal.skip();
    reveal.skip();
    expect(shown).toEqual([0, 500]);
    expect(completions()).toBe(1);
  });

  it('starts over when started again', () => {
    const { reveal, shown, completions } = make([0, 500]);
    reveal.start();
    vi.advanceTimersByTime(500);
    expect(reveal.isComplete).toBe(true);
    reveal.start();
    expect(reveal.isComplete).toBe(false);
    vi.advanceTimersByTime(500);
    expect(shown).toEqual([0, 500, 0, 500]);
    expect(completions()).toBe(2);
  });
});
