// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { skyTileCount, skyTileLayout, SKY_DRIFT_PX_PER_SEC } from '../src/game/SkyDrift';

describe('skyTileCount', () => {
  it('covers a viewport with one tile of buffer on each side', () => {
    expect(skyTileCount(1920, 1920)).toBe(3);
    expect(skyTileCount(960, 1920)).toBe(4);
    expect(skyTileCount(1920, 640)).toBe(3);
  });
});

/** True if every tile's x..x+tileWidth span is covered by the layout, i.e. no gap in [0, viewportWidth). */
function fullyCovers(layout: ReadonlyArray<{ x: number }>, tileWidth: number, viewportWidth: number): boolean {
  const spans = [...layout].sort((a, b) => a.x - b.x);
  let covered = spans[0]?.x ?? Number.POSITIVE_INFINITY;
  if (covered > 0) return false;
  for (const { x } of spans) {
    if (x > covered) return false;
    covered = Math.max(covered, x + tileWidth);
  }
  return covered >= viewportWidth;
}

describe('skyTileLayout', () => {
  const tileWidth = 1920;
  const viewportWidth = 1920;
  const count = skyTileCount(tileWidth, viewportWidth);

  it('fully covers the viewport with no gap, at rest', () => {
    const layout = skyTileLayout(0, tileWidth, count);
    expect(layout).toHaveLength(count);
    expect(fullyCovers(layout, tileWidth, viewportWidth)).toBe(true);
  });

  it('keeps covering the viewport at a fractional drift offset', () => {
    const layout = skyTileLayout(tileWidth / 2, tileWidth, count);
    expect(fullyCovers(layout, tileWidth, viewportWidth)).toBe(true);
  });

  it('keeps covering the viewport after drifting a full tile width', () => {
    const layout = skyTileLayout(tileWidth, tileWidth, count);
    expect(fullyCovers(layout, tileWidth, viewportWidth)).toBe(true);
  });

  it('keeps covering the viewport at a large, many-tiles-later drift offset', () => {
    const layout = skyTileLayout(tileWidth * 11.3, tileWidth, count);
    expect(fullyCovers(layout, tileWidth, viewportWidth)).toBe(true);
  });

  it('alternates flipped and unflipped, so every tile boundary is a self-mirror match', () => {
    const layout = [...skyTileLayout(0, tileWidth, count)].sort((a, b) => a.x - b.x);
    for (let i = 1; i < layout.length; i += 1) {
      expect(layout[i]?.flipped, `tile ${i}`).not.toBe(layout[i - 1]?.flipped);
    }
  });

  it('keeps the alternating pattern in step as the drift offset grows, not just at rest', () => {
    const layout = [...skyTileLayout(tileWidth * 2.5, tileWidth, count)].sort((a, b) => a.x - b.x);
    for (let i = 1; i < layout.length; i += 1) {
      expect(layout[i]?.flipped, `tile ${i}`).not.toBe(layout[i - 1]?.flipped);
    }
  });
});

describe('SKY_DRIFT_PX_PER_SEC', () => {
  it('is slow: a full 1920px cycle takes several minutes', () => {
    expect(1920 / SKY_DRIFT_PX_PER_SEC).toBeGreaterThan(60);
  });
});

describe('sky tile rendering', () => {
  const scene = readFileSync(new URL('../src/game/scenes/BoulevardSpikeScene.ts', import.meta.url), 'utf8') as string;

  it('turns off pixel-snapping on the sky tiles, since the drift is sub-pixel-per-frame', () => {
    // The game's global roundPixels (createGame.ts) snaps every other GameObject to whole pixels, which is right
    // for crisp character/building art but held each sky tile at the same rounded position for several frames at
    // a time at this drift speed, then jumped it a whole pixel -- visibly jittery motion, and independent
    // per-tile rounding could round two neighbouring tiles apart by a pixel, flashing the background colour
    // through the gap between them.
    expect(scene).toContain("setVertexRoundMode('off')");
  });
});
