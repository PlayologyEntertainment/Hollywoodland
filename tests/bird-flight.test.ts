// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  BIRD_FRAME_COUNT,
  BIRD_FRAME_SIZE,
  birdPosition,
  flapFrame,
  FLOCK_INTERVAL_MS,
  flockFinished,
  nextFlockDelayMs,
  planFlock,
  wingOutline,
} from '../src/game/BirdFlight';
import { isPictureCovered } from '../src/game/PictureCover';

/** A repeatable stand-in for Math.random. */
function seeded(seed: number): () => number {
  let state = seed;
  const next = (): number => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
  // A linear generator's first values barely differ between small seeds; let it run a few steps first.
  for (let warmUp = 0; warmUp < 5; warmUp += 1) next();
  return next;
}

const VIEW_W = 1920;
const VIEW_H = 1080;

describe('nextFlockDelayMs', () => {
  it('waits between 15 and 30 seconds', () => {
    expect(FLOCK_INTERVAL_MS).toEqual({ min: 15_000, max: 30_000 });
    expect(nextFlockDelayMs(() => 0)).toBe(15_000);
    expect(nextFlockDelayMs(() => 0.999999)).toBeCloseTo(30_000, -1);
    const random = seeded(7);
    for (let index = 0; index < 50; index += 1) {
      const wait = nextFlockDelayMs(random);
      expect(wait).toBeGreaterThanOrEqual(15_000);
      expect(wait).toBeLessThanOrEqual(30_000);
    }
  });
});

describe('planFlock', () => {
  it('makes a flock of two or three birds that differ from one another', () => {
    const sizes = new Set<number>();
    for (let seed = 1; seed <= 40; seed += 1) {
      const flock = planFlock(seeded(seed), VIEW_H);
      sizes.add(flock.length);
      expect(flock.length).toBeGreaterThanOrEqual(2);
      expect(flock.length).toBeLessThanOrEqual(3);
      expect(new Set(flock.map((bird) => bird.scale)).size).toBe(flock.length);
      expect(new Set(flock.map((bird) => bird.flapPhase)).size).toBe(flock.length);
    }
    expect([...sizes].sort()).toEqual([2, 3]);
  });

  it('keeps every bird in the top third of the picture, and staggers their entrances', () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const flock = planFlock(seeded(seed), VIEW_H);
      expect(flock[0]?.delayMs).toBe(0);
      flock.forEach((bird, index) => {
        expect(bird.baseY).toBeGreaterThan(0);
        expect(bird.baseY + bird.bobAmplitudePx).toBeLessThan(VIEW_H / 3);
        if (index > 0) expect(bird.delayMs).toBeGreaterThan(flock[index - 1]?.delayMs ?? 0);
      });
    }
  });
});

describe('birdPosition', () => {
  const [bird] = planFlock(seeded(3), VIEW_H);

  it('flies right to left: in from past the right edge, out past the left', () => {
    if (bird === undefined) throw new Error('no bird');
    expect(birdPosition(bird, 0, VIEW_W).x).toBeGreaterThan(VIEW_W);
    let last = Number.POSITIVE_INFINITY;
    for (let time = 0; time < 20_000; time += 500) {
      const { x } = birdPosition(bird, time, VIEW_W);
      expect(x).toBeLessThan(last);
      last = x;
    }
    expect(birdPosition(bird, 60_000, VIEW_W).active).toBe(false);
  });

  it('is not flying before its entrance, and crosses the whole screen in a few seconds', () => {
    const late = { ...(bird ?? planFlock(seeded(3), VIEW_H)[0]!), delayMs: 1_000 };
    expect(birdPosition(late, 500, VIEW_W).active).toBe(false);
    expect(birdPosition(late, 1_500, VIEW_W).active).toBe(true);
    const crossingMs = ((VIEW_W + 180) / late.speedPxPerSec) * 1000;
    expect(crossingMs).toBeGreaterThan(8_000);
    expect(crossingMs).toBeLessThan(16_000);
  });

  it('stays in the top third while it bobs', () => {
    if (bird === undefined) throw new Error('no bird');
    for (let time = 0; time < 12_000; time += 100) expect(birdPosition(bird, time, VIEW_W).y).toBeLessThan(VIEW_H / 3);
  });
});

describe('flockFinished', () => {
  it('is false while any bird is still to enter or still flying, and true once all have left', () => {
    const flock = planFlock(seeded(11), VIEW_H);
    expect(flockFinished(flock, 0, VIEW_W)).toBe(false);
    expect(flockFinished(flock, 5_000, VIEW_W)).toBe(false);
    expect(flockFinished(flock, 120_000, VIEW_W)).toBe(true);
  });
});

describe('the flap', () => {
  it('runs through every pose in a cycle, and back round', () => {
    const [bird] = planFlock(seeded(5), VIEW_H);
    if (bird === undefined) throw new Error('no bird');
    const seen = new Set<number>();
    for (let time = 0; time < bird.flapPeriodMs; time += 10) seen.add(flapFrame(bird, bird.delayMs + time));
    expect(seen.size).toBe(BIRD_FRAME_COUNT);
    for (const frame of seen) {
      expect(frame).toBeGreaterThanOrEqual(0);
      expect(frame).toBeLessThan(BIRD_FRAME_COUNT);
    }
    expect(flapFrame(bird, bird.delayMs + 123)).toBe(flapFrame(bird, bird.delayMs + 123 + bird.flapPeriodMs));
  });

  it('draws a wing that stays inside its picture and whose tip rises and falls', () => {
    const tips: number[] = [];
    for (let frame = 0; frame < BIRD_FRAME_COUNT; frame += 1) {
      const outline = wingOutline(frame);
      for (const point of outline) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(BIRD_FRAME_SIZE.width / 2);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(BIRD_FRAME_SIZE.height);
      }
      tips.push(outline[2]?.y ?? 0);
    }
    expect(Math.min(...tips)).toBeLessThan(Math.max(...tips) - 20);
  });
});

describe('isPictureCovered', () => {
  const page = (present: readonly string[]): Pick<Document, 'querySelector'> => ({
    querySelector: (selector: string) => (present.some((piece) => selector.includes(piece)) ? ({} as Element) : null),
  });

  it('is false on the open Boulevard', () => {
    expect(isPictureCovered(page([]))).toBe(false);
  });

  it('is true for an open dialog, a chapter card, the conclusion card, or the menus', () => {
    expect(isPictureCovered(page(['dialog[open]']))).toBe(true);
    expect(isPictureCovered(page(['#chapter-title:not([hidden])']))).toBe(true);
    expect(isPictureCovered(page(['#chapter-conclusion:not([hidden])']))).toBe(true);
    expect(isPictureCovered(page(['#play-hud[hidden]']))).toBe(true);
  });
});

describe('the birds in the scene', () => {
  const scene = readFileSync(new URL('../src/game/scenes/BoulevardSpikeScene.ts', import.meta.url), 'utf8') as string;

  it('are fixed to the screen, above the foreground, and never drawn with Reduce Motion on', () => {
    expect(scene).toContain('.setScrollFactor(0).setDepth(BIRD_DEPTH)');
    expect(scene).toMatch(/const BIRD_DEPTH = 4\d;/);
    expect(scene).toMatch(/updateBirds[\s\S]{0,200}if \(this\.settings\.reducedMotion\) \{[\s\S]{0,120}clearFlock/);
  });

  it('stand still while the picture is covered', () => {
    expect(scene).toContain('this.pictureCovered = isPictureCovered();');
    expect(scene).toMatch(/if \(this\.pictureCovered\) return;/);
  });
});
