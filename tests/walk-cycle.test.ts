// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_WALK_CYCLE,
  distanceForFrame,
  footprintsForFrame,
  frameBackground,
  isWalkCycle,
  walkFrameAt,
  type WalkCycle,
} from '../src/game/WalkCycle';

const publicFile = (path: string): URL => new URL(`../public/${path}`, import.meta.url);
const committed = JSON.parse(readFileSync(publicFile('data/walk-cycle.json'), 'utf8')) as WalkCycle;

/** The parts of Node's Buffer that webpSize reads (the import above is untyped). */
interface NodeBuffer {
  toString(encoding: 'ascii', start: number, end: number): string;
  readUIntLE(offset: number, length: number): number;
  readUInt16LE(offset: number): number;
  readUInt32LE(offset: number): number;
}

/** Width and height of a WebP without an image library (see boulevard-manifest.test.ts). */
function webpSize(path: string): { width: number; height: number } {
  const b: NodeBuffer = readFileSync(publicFile(path));
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`${path} is not a WebP`);
  }
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (kind === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  throw new Error(`${path}: unknown WebP chunk ${kind}`);
}

/** The original 8-frame sheet, kept as a fixture: 8 frames per 8 / 11 s at 390 px/s. */
const LEGACY_CYCLE: WalkCycle = {
  sheet: 'assets/characters/aspiring-actor-walk.webp',
  columns: 4,
  frameWidth: 384,
  frameHeight: 512,
  frameCount: 8,
  idleFrame: 0,
  displayScale: 0.42,
  soleY: 493,
  strideWorld: (390 * 8) / 11,
  feet: [],
  idleFeet: null,
};

const foot = (x: number, lift = 0): { x: number; lift: number } => ({ x, lift });
const cycle16: WalkCycle = {
  sheet: 'assets/characters/example.webp',
  columns: 4,
  frameWidth: 448,
  frameHeight: 480,
  frameCount: 16,
  idleFrame: 16,
  displayScale: 0.46,
  soleY: 465,
  strideWorld: 224,
  feet: Array.from({ length: 16 }, () => [foot(-40), foot(40, 12)] as const),
  idleFeet: [foot(20), foot(20)],
};

describe('committed walk cycle', () => {
  it('passes the runtime validator', () => {
    expect(isWalkCycle(committed)).toBe(true);
  });

  it('is identical to the built-in fallback default', () => {
    expect(DEFAULT_WALK_CYCLE).toEqual(committed);
  });

  it('describes the sheet that is actually on disk', () => {
    const size = webpSize(committed.sheet);
    const total = committed.frameCount + (committed.idleFrame >= committed.frameCount ? 1 : 0);
    expect(size.width).toBe(committed.columns * committed.frameWidth);
    expect(size.height).toBe(Math.ceil(total / committed.columns) * committed.frameHeight);
  });

  it('keeps every measured foot on the frame and at least one foot planted per frame', () => {
    for (const pair of committed.feet) {
      expect(pair.some((f) => f.lift === 0)).toBe(true);
      for (const f of pair) expect(Math.abs(f.x)).toBeLessThan(committed.frameWidth / 2);
    }
  });
});

describe('isWalkCycle', () => {
  it('accepts a full cycle with foot data', () => {
    expect(isWalkCycle(cycle16)).toBe(true);
  });

  it('rejects a foot table that does not match the frame count', () => {
    expect(isWalkCycle({ ...cycle16, feet: cycle16.feet.slice(0, 15) })).toBe(false);
  });

  it('rejects an idle frame past the end of the loop', () => {
    expect(isWalkCycle({ ...cycle16, idleFrame: 17 })).toBe(false);
  });

  it('rejects non-positive timing and non-objects', () => {
    expect(isWalkCycle({ ...cycle16, strideWorld: 0 })).toBe(false);
    expect(isWalkCycle({ ...cycle16, frameCount: 0 })).toBe(false);
    expect(isWalkCycle(null)).toBe(false);
    expect(isWalkCycle([])).toBe(false);
  });
});

describe('walkFrameAt', () => {
  it('advances one frame per stride/frameCount of ground walked', () => {
    const step = cycle16.strideWorld / cycle16.frameCount;
    expect(walkFrameAt(cycle16, 0)).toBe(0);
    expect(walkFrameAt(cycle16, step * 1.01)).toBe(1);
    expect(walkFrameAt(cycle16, step * 8.01)).toBe(8);
    expect(walkFrameAt(cycle16, step * 15.99)).toBe(15);
  });

  it('wraps after one full stride and for very long walks', () => {
    expect(walkFrameAt(cycle16, cycle16.strideWorld)).toBe(0);
    expect(walkFrameAt(cycle16, cycle16.strideWorld * 1234 + 3)).toBe(0);
  });

  it('never leaves the loop, for any distance including negative and fractional ones', () => {
    for (let d = -1000; d <= 1000; d += 7.3) {
      const frame = walkFrameAt(cycle16, d);
      expect(Number.isInteger(frame)).toBe(true);
      expect(frame).toBeGreaterThanOrEqual(0);
      expect(frame).toBeLessThan(16);
    }
  });

  it('takes the same time-independent path at any speed: frame depends only on distance', () => {
    // Walking 300px in one big step or in 300 one-pixel steps lands on the same frame.
    let walked = 0;
    for (let i = 0; i < 300; i += 1) walked += 1;
    expect(walkFrameAt(cycle16, walked)).toBe(walkFrameAt(cycle16, 300));
  });

  it('starts a walk from the standing pose without a jump', () => {
    const loopFrame = 4;
    const cycle = { ...cycle16, idleFrame: loopFrame, idleFeet: null };
    expect(walkFrameAt(cycle, distanceForFrame(cycle, loopFrame))).toBe(loopFrame);
  });

  it('reproduces the old 8-frame timing for the legacy sheet', () => {
    // 8 frames per 8 / 11 s at 390 px/s: one frame every 390 / 11 px.
    const px = 390 / 11;
    expect(walkFrameAt(LEGACY_CYCLE, px * 0.5)).toBe(0);
    expect(walkFrameAt(LEGACY_CYCLE, px * 1.5)).toBe(1);
    expect(walkFrameAt(LEGACY_CYCLE, px * 7.5)).toBe(7);
  });
});

describe('footprintsForFrame', () => {
  it('scales a foot to display px and maps its lift to 0..1', () => {
    const [rear, front] = footprintsForFrame(cycle16, 3);
    expect(rear).toEqual({ dx: -40 * 0.46, lift: 0 });
    expect(front?.dx).toBeCloseTo(40 * 0.46);
    expect(front?.lift).toBeCloseTo(12 / 40);
  });

  it('clamps a very high foot to fully lifted', () => {
    const high = { ...cycle16, feet: cycle16.feet.map(() => [foot(0), foot(0, 400)] as const) };
    expect(footprintsForFrame(high, 0)[1]?.lift).toBe(1);
  });

  it('uses the dedicated idle feet for the frame after the loop', () => {
    expect(footprintsForFrame(cycle16, 16).map((p) => p.dx)).toEqual([20 * 0.46, 20 * 0.46]);
  });

  it('returns nothing when the cycle has no foot data', () => {
    expect(footprintsForFrame(LEGACY_CYCLE, 0)).toEqual([]);
    expect(footprintsForFrame(cycle16, 99)).toEqual([]);
  });
});

describe('frameBackground', () => {
  it('shows the first frame of the 4x2 sheet exactly as the old CSS did', () => {
    expect(frameBackground(LEGACY_CYCLE, 0)).toEqual({ size: '400% 200%', position: '0% 0%' });
  });

  it('locates the idle frame on the last row of the 4x5 sheet', () => {
    expect(frameBackground(cycle16, 16)).toEqual({ size: '400% 500%', position: '0% 100%' });
    expect(frameBackground(cycle16, 5)).toEqual({ size: '400% 500%', position: `${(1 / 3) * 100}% 25%` });
  });
});
