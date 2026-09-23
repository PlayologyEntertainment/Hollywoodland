/** How fast the sky drifts, in display px/sec. At the live sky tile's width (1920px), a full cycle takes 8
 * minutes — a slow, ambient drift meant to be felt rather than watched. */
export const SKY_DRIFT_PX_PER_SEC = 4;

export interface SkyTilePlacement {
  readonly x: number;
  /** Mirror-tiling: alternating an unflipped and a horizontally-flipped copy of the same image makes every tile
   * boundary a self-mirror match, so even art whose left and right edges don't match tiles with no visible seam. */
  readonly flipped: boolean;
}

/** How many tiles are needed to always fully cover a viewport of `viewportWidth`, however the drift offset has
 * wrapped — one tile of buffer on each side of the visible range. */
export function skyTileCount(tileWidth: number, viewportWidth: number): number {
  return Math.ceil(viewportWidth / tileWidth) + 2;
}

/** Where each of `count` tiles should sit and whether each should be mirrored, for the current accumulated drift
 * offset (`driftX`, growing over time for a left-to-right drift). Recomputed fresh from `driftX` alone each call —
 * no per-tile recycling state to keep in sync. */
export function skyTileLayout(driftX: number, tileWidth: number, count: number): readonly SkyTilePlacement[] {
  const firstIndex = Math.floor(-driftX / tileWidth) - 1;
  return Array.from({ length: count }, (_, n) => {
    const index = firstIndex + n;
    return { x: index * tileWidth + driftX, flipped: index % 2 !== 0 };
  });
}
