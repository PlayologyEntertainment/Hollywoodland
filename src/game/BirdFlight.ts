/** Ambient birds: now and then a small flock crosses the top third of the screen from right to left. Everything here is plain
 * arithmetic on times and numbers, so the flock's timing and paths are tested without a browser; BoulevardSpikeScene draws it. */

/** The wait between one flock's appearance and the next, in milliseconds (also the wait before the first, from entering the
 * Boulevard). */
export const FLOCK_INTERVAL_MS = { min: 15_000, max: 30_000 } as const;

/** How many poses make one flap cycle, and the size of each pose's picture. */
export const BIRD_FRAME_COUNT = 8;
export const BIRD_FRAME_SIZE = { width: 64, height: 40 } as const;

/** Birds fly in the top third of the picture, clear of the very edge. */
const TOP_MARGIN_FRACTION = 0.04;
const BAND_FRACTION = 1 / 3;
/** How far past the screen's edge a bird starts and finishes, so it is never seen popping in or out. */
const OFFSCREEN_MARGIN_PX = 90;

export interface BirdPlan {
  /** Milliseconds after the flock appears before this bird enters (the flock is staggered, not a line abreast). */
  readonly delayMs: number;
  readonly baseY: number;
  readonly scale: number;
  readonly speedPxPerSec: number;
  readonly flapPeriodMs: number;
  /** Where in the flap cycle the bird begins, 0 to 1, so the flock does not flap in step. */
  readonly flapPhase: number;
  readonly bobAmplitudePx: number;
  readonly bobPeriodMs: number;
}

function between(random: () => number, low: number, high: number): number {
  return low + random() * (high - low);
}

export function nextFlockDelayMs(random: () => number): number {
  return between(random, FLOCK_INTERVAL_MS.min, FLOCK_INTERVAL_MS.max);
}

/** Two or three birds, each a little different in height, size, speed and flap, entering one after another. `random` returns
 * numbers from 0 up to (not including) 1. */
export function planFlock(random: () => number, viewHeight: number): BirdPlan[] {
  const count = random() < 0.6 ? 2 : 3;
  const bandTop = viewHeight * TOP_MARGIN_FRACTION;
  const bandBottom = viewHeight * BAND_FRACTION;
  const leaderY = between(random, bandTop + 40, bandBottom - 60);
  const leaderSpeed = between(random, 140, 190);
  const plans: BirdPlan[] = [];
  for (let index = 0; index < count; index += 1) {
    plans.push({
      delayMs: index === 0 ? 0 : index * between(random, 350, 900),
      baseY: Math.min(bandBottom - 20, Math.max(bandTop + 20, leaderY + between(random, -45, 45))),
      scale: between(random, 0.75, 1.3),
      speedPxPerSec: leaderSpeed * between(random, 0.93, 1.07),
      flapPeriodMs: between(random, 380, 560),
      flapPhase: random(),
      bobAmplitudePx: between(random, 6, 14),
      bobPeriodMs: between(random, 1800, 3000),
    });
  }
  return plans;
}

export interface BirdPosition {
  readonly x: number;
  readonly y: number;
  /** False before the bird has entered, and after it has left. */
  readonly active: boolean;
}

/** Where a bird is `elapsedMs` after its flock appeared: in from just past the right edge, out past the left. */
export function birdPosition(plan: BirdPlan, elapsedMs: number, viewWidth: number): BirdPosition {
  const flying = elapsedMs - plan.delayMs;
  const x = viewWidth + OFFSCREEN_MARGIN_PX - (plan.speedPxPerSec * flying) / 1000;
  const y = plan.baseY + plan.bobAmplitudePx * Math.sin((2 * Math.PI * flying) / plan.bobPeriodMs);
  return { x, y, active: flying >= 0 && x > -OFFSCREEN_MARGIN_PX };
}

export function flockFinished(plans: readonly BirdPlan[], elapsedMs: number, viewWidth: number): boolean {
  return plans.every((plan) => elapsedMs - plan.delayMs >= 0 && !birdPosition(plan, elapsedMs, viewWidth).active);
}

/** Which of the flap cycle's poses a bird is in `elapsedMs` after its flock appeared. */
export function flapFrame(plan: BirdPlan, elapsedMs: number): number {
  const cycles = (elapsedMs - plan.delayMs) / plan.flapPeriodMs + plan.flapPhase;
  const within = cycles - Math.floor(cycles);
  return Math.min(BIRD_FRAME_COUNT - 1, Math.floor(within * BIRD_FRAME_COUNT));
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** The outline of one wing for a flap pose, for the left wing (mirror x about the body for the right). `frame` runs through the
 * cycle: wings high, level, low, level again. Drawn in a BIRD_FRAME_SIZE picture with the body at its centre. */
export function wingOutline(frame: number): Point[] {
  const lift = Math.cos((2 * Math.PI * frame) / BIRD_FRAME_COUNT);
  const cx = BIRD_FRAME_SIZE.width / 2;
  const cy = BIRD_FRAME_SIZE.height / 2 + 2;
  return [
    { x: cx - 2, y: cy - 1 },
    { x: cx - 11, y: cy - 6 - lift * 6 },
    { x: cx - 26, y: cy - lift * 15 - 2 },
    { x: cx - 18, y: cy - lift * 7 + 2 },
    { x: cx - 8, y: cy + 2 - lift * 2 },
    { x: cx - 2, y: cy + 3 },
  ];
}
