import { describe, expect, it } from 'vitest';

import { FpsMeter } from '../src/game/FpsMeter';
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/settings/Settings';

describe('FpsMeter', () => {
  it('releases a figure once per window, averaged over the frames in it', () => {
    const meter = new FpsMeter(500);
    const results: Array<number | undefined> = [];
    for (let t = 0; t <= 1100; t += 1000 / 60) results.push(meter.frame(t));
    const figures = results.filter((value) => value !== undefined);
    expect(figures).toHaveLength(2);
    for (const fps of figures) expect(fps).toBe(60);
  });

  it('reports a slow stretch as a low figure', () => {
    const meter = new FpsMeter(500);
    let last: number | undefined;
    for (let t = 0; t <= 1000; t += 50) last = meter.frame(t) ?? last;
    expect(last).toBe(20);
  });

  it('ignores the gap after a reset', () => {
    const meter = new FpsMeter(500);
    meter.frame(0);
    meter.reset();
    expect(meter.frame(10_000)).toBeUndefined();
  });
});

describe('showFps setting', () => {
  it('is off by default and only accepts a real boolean', () => {
    expect(DEFAULT_SETTINGS.showFps).toBe(false);
    expect(normalizeSettings({ showFps: true }).showFps).toBe(true);
    expect(normalizeSettings({ showFps: 'yes' }).showFps).toBe(false);
  });
});
