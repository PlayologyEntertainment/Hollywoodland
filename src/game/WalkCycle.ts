/** Timing and footprint data for the player's walk-cycle sprite sheet,
 * loaded at runtime from `public/data/walk-cycle.json` so the sheet and its
 * numbers change together as a pure asset swap. Everything here is pure (no
 * Phaser) so the scene's animation and shadow maths can be tested directly.
 *
 * The cycle is DISTANCE-driven, not time-driven: the frame shown is a function
 * of how far the character has walked, and `strideWorld` is the ground the
 * feet cover in one full loop of the sheet. That keeps the planted foot fixed
 * to the street at any walk speed (and at the reduced-motion speed), and the
 * feet stop the instant the character does. */

/** One foot's contact with the ground in a given frame, in the sheet's own
 * pixels: `x` is measured from the frame's horizontal centre toward the
 * direction the character faces; `lift` is the height of the sole above the
 * ground line (0 = planted). */
export interface WalkFoot {
  readonly x: number;
  readonly lift: number;
}

export interface WalkCycle {
  /** Path under public/, e.g. `assets/characters/aspiring-actor-walk.webp`. */
  readonly sheet: string;
  /** Frames per row of the sheet (rows follow from the frame count). */
  readonly columns: number;
  readonly frameWidth: number;
  readonly frameHeight: number;
  /** Frames in one full loop (a left step plus a right step): sheet indices 0 to frameCount - 1. */
  readonly frameCount: number;
  /** Sheet index of the standing pose: either a loop frame or `frameCount`, a dedicated frame just after the loop. */
  readonly idleFrame: number;
  /** Display px per sheet px. */
  readonly displayScale: number;
  /** Sheet px from the top of a frame down to the ground line the soles rest on. */
  readonly soleY: number;
  /** World px of ground covered by one full loop of `frameCount` frames. */
  readonly strideWorld: number;
  /** Per loop frame, the two feet ordered rear then front. Empty when unmeasured. */
  readonly feet: readonly (readonly [WalkFoot, WalkFoot])[];
  /** The two feet of a dedicated idle frame (`idleFrame === frameCount`), or null. */
  readonly idleFeet: readonly [WalkFoot, WalkFoot] | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const isPositive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function isFoot(value: unknown): value is WalkFoot {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.lift) && value.lift >= 0;
}

function isFootPair(value: unknown): value is readonly [WalkFoot, WalkFoot] {
  return Array.isArray(value) && value.length === 2 && isFoot(value[0]) && isFoot(value[1]);
}

/** Structural check for the JSON file. The scene falls back to
 * DEFAULT_WALK_CYCLE rather than crashing on a missing or invalid file. */
export function isWalkCycle(value: unknown): value is WalkCycle {
  if (
    !isRecord(value) ||
    typeof value.sheet !== 'string' ||
    !isPositive(value.columns) ||
    !Number.isInteger(value.columns) ||
    !isPositive(value.frameWidth) ||
    !isPositive(value.frameHeight) ||
    !isPositive(value.frameCount) ||
    !Number.isInteger(value.frameCount) ||
    !isFiniteNumber(value.idleFrame) ||
    !Number.isInteger(value.idleFrame) ||
    value.idleFrame < 0 ||
    !isPositive(value.displayScale) ||
    !isPositive(value.soleY) ||
    !isPositive(value.strideWorld) ||
    !Array.isArray(value.feet) ||
    value.idleFeet === undefined
  ) {
    return false;
  }
  if (value.idleFrame > value.frameCount) return false;
  if (value.feet.length !== 0 && value.feet.length !== value.frameCount) return false;
  if (value.idleFeet !== null && !isFootPair(value.idleFeet)) return false;
  return value.feet.every(isFootPair);
}

/** The built-in copy of data/walk-cycle.json (a test keeps them identical), used only
 * when that file is missing or invalid. */
export const DEFAULT_WALK_CYCLE: WalkCycle = {
  sheet: 'assets/characters/aspiring-actor-walk.webp',
  columns: 4,
  frameWidth: 448,
  frameHeight: 480,
  frameCount: 16,
  idleFrame: 16,
  displayScale: 0.461,
  soleY: 465,
  strideWorld: 223.5,
  feet: [
    [{ x: -91.2, lift: 7 }, { x: 118.6, lift: 0 }],
    [{ x: -83.6, lift: 1 }, { x: 90.3, lift: 0 }],
    [{ x: -99.2, lift: 22 }, { x: 54.8, lift: 0 }],
    [{ x: -22.6, lift: 56 }, { x: 26.9, lift: 0 }],
    [{ x: -4.5, lift: 0 }, { x: -4.5, lift: 0 }],
    [{ x: -31.6, lift: 0 }, { x: 95.5, lift: 38 }],
    [{ x: -68.7, lift: 0 }, { x: 137.9, lift: 13 }],
    [{ x: -87.3, lift: 0 }, { x: 116.9, lift: 17 }],
    [{ x: -89.4, lift: 1 }, { x: 113.4, lift: 0 }],
    [{ x: -87.9, lift: 4 }, { x: 80.4, lift: 0 }],
    [{ x: -94.6, lift: 13 }, { x: 65.2, lift: 0 }],
    [{ x: -23.1, lift: 53 }, { x: 8.3, lift: 0 }],
    [{ x: -3.0, lift: 0 }, { x: 41.6, lift: 38 }],
    [{ x: -32.7, lift: 0 }, { x: 114.0, lift: 22 }],
    [{ x: -69.8, lift: 0 }, { x: 135.0, lift: 12 }],
    [{ x: -101.4, lift: 0 }, { x: 128.0, lift: 11 }],
  ],
  idleFeet: [{ x: 27.5, lift: 0 }, { x: 27.5, lift: 0 }],
};

/** Frame to show after the character has walked `distance` world px in total.
 * Wraps in both directions and is defined for any finite distance. */
export function walkFrameAt(cycle: Pick<WalkCycle, 'frameCount' | 'strideWorld'>, distance: number): number {
  const phase = distance / cycle.strideWorld;
  const frame = Math.floor((phase - Math.floor(phase)) * cycle.frameCount);
  return Math.min(frame, cycle.frameCount - 1);
}

/** The distance (mod one stride) at which `walkFrameAt` first returns `frame`,
 * so a walk can start on the standing pose instead of popping to another one. */
export function distanceForFrame(cycle: Pick<WalkCycle, 'frameCount' | 'strideWorld'>, frame: number): number {
  return (frame / cycle.frameCount) * cycle.strideWorld;
}

/** A footprint on the ground, in world px offsets from the character's x
 * (positive = ahead of a right-facing character; the scene flips for left). */
export interface Footprint {
  readonly dx: number;
  /** 0 = planted, 1 = fully raised (print at its faintest and smallest). */
  readonly lift: number;
}

/** Height (sheet px) at which a foot's print has fully faded. */
const FULL_LIFT_PX = 40;

/** The two shoe prints for a sheet frame (rear then front), or an empty list
 * when the cycle has no foot data for it. */
export function footprintsForFrame(cycle: WalkCycle, frame: number): readonly Footprint[] {
  const pair = frame < cycle.frameCount ? cycle.feet[frame] : frame === cycle.idleFrame ? cycle.idleFeet : undefined;
  if (pair === undefined || pair === null) return [];
  return pair.map((foot) => ({
    dx: foot.x * cycle.displayScale,
    lift: Math.min(1, Math.max(0, foot.lift / FULL_LIFT_PX)),
  }));
}

/** Where a sheet frame sits in the sheet, as CSS `background-position` and
 * `background-size` percentages, so a UI element can show one frame of the
 * sheet as a portrait. */
export function frameBackground(cycle: WalkCycle, frame: number): { readonly size: string; readonly position: string } {
  const total = cycle.frameCount + (cycle.idleFrame >= cycle.frameCount ? 1 : 0);
  const rows = Math.ceil(total / cycle.columns);
  const col = frame % cycle.columns;
  const row = Math.floor(frame / cycle.columns);
  const percent = (index: number, count: number): number => (count > 1 ? (index / (count - 1)) * 100 : 0);
  return {
    size: `${cycle.columns * 100}% ${rows * 100}%`,
    position: `${percent(col, cycle.columns)}% ${percent(row, rows)}%`,
  };
}
