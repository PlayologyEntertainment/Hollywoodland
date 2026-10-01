// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { blendLooks, easeInOut, lerpColor, lightFlipTimes, TIME_FADE_MS, TIME_LOOKS, TIME_SKY_PATHS } from '../src/game/TimeOfDay';

describe('time of day looks', () => {
  it('leave the afternoon exactly as drawn, and give morning and evening their own grade', () => {
    expect(TIME_LOOKS.afternoon).toEqual({ multiply: 0xffffff, glow: 0xffffff, glowAlpha: 0 });
    expect(TIME_LOOKS.morning.multiply).not.toBe(0xffffff);
    expect(TIME_LOOKS.evening.glowAlpha).toBeGreaterThan(0);
    // Evening is warm (more red than blue), morning is cool (more blue than red).
    const red = (c: number): number => (c >> 16) & 0xff;
    const blue = (c: number): number => c & 0xff;
    expect(red(TIME_LOOKS.evening.multiply)).toBeGreaterThan(blue(TIME_LOOKS.evening.multiply));
    expect(blue(TIME_LOOKS.morning.multiply)).toBeGreaterThan(red(TIME_LOOKS.morning.multiply));
  });

  it('fade over one to four seconds', () => {
    expect(TIME_FADE_MS).toBeGreaterThanOrEqual(1000);
    expect(TIME_FADE_MS).toBeLessThanOrEqual(4000);
  });

  it('blend colours channel by channel and land exactly on both ends', () => {
    expect(lerpColor(0x000000, 0xffffff, 0)).toBe(0x000000);
    expect(lerpColor(0x000000, 0xffffff, 1)).toBe(0xffffff);
    expect(lerpColor(0xff0000, 0x0000ff, 0.5)).toBe(0x800080);
    const mid = blendLooks(TIME_LOOKS.afternoon, TIME_LOOKS.evening, 0.5);
    expect(mid.glowAlpha).toBeCloseTo(TIME_LOOKS.evening.glowAlpha / 2);
    expect(blendLooks(TIME_LOOKS.morning, TIME_LOOKS.evening, 1)).toEqual(TIME_LOOKS.evening);
  });

  it('ease gently at both ends and stay in range', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(0.1)).toBeLessThan(0.1);
    expect(easeInOut(-1)).toBe(0);
    expect(easeInOut(2)).toBe(1);
  });
});

describe('building light timing', () => {
  it('spreads the switches around the middle of the blend, in a fixed order', () => {
    const times = lightFlipTimes(4);
    expect(times).toEqual(lightFlipTimes(4));
    expect(new Set(times).size).toBe(4);
    for (const t of times) {
      expect(t).toBeGreaterThanOrEqual(TIME_FADE_MS / 2 - 500);
      expect(t).toBeLessThanOrEqual(TIME_FADE_MS / 2 + 500);
    }
    expect(lightFlipTimes(1, 3000, 1000)).toEqual([1000]);
  });
});

describe('the scene and the time of day', () => {
  const scene = readFileSync(new URL('../src/game/scenes/BoulevardSpikeScene.ts', import.meta.url), 'utf8');

  it('names an optional sky for morning and evening, beside the Afternoon sky', () => {
    expect(Object.keys(TIME_SKY_PATHS).sort()).toEqual(['evening', 'morning']);
    expect(scene).toContain('Object.entries(TIME_SKY_PATHS)');
  });

  it('switches lit building art on and off instantly, never fading it', () => {
    expect(scene).toContain('overlay.setAlpha(building.lit ? 1 : 0)');
    expect(scene).toContain('lightFlipTimes(this.dynamicBuildings.length)');
    expect(scene).not.toContain('building.image.setTexture');
    expect(scene).not.toContain('fromLights');
  });

  it('jumps straight to the right look after a load or a new career, and fades on any other change', () => {
    expect(scene).toMatch(/this\.snapTime = true;\s*this\.emitState\(\);/);
    expect(scene).toContain('this.timeSlot !== undefined && !this.snapTime && !this.settings.reducedMotion');
  });
});
