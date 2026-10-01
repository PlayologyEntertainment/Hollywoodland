import type { TimeSlot } from '../domain/TimeSystem';

/** How long the whole scene takes to blend from one time of day to the next: sky, grade and lit windows together. */
export const TIME_FADE_MS = 3000;

/** The Afternoon sky is the Boulevard's own sky plane; Morning and Evening are extra skies swapped in over it. Both are optional at
 * runtime: until the art is promoted into public/assets, the Afternoon sky stands in and the grade alone carries the mood. */
export const TIME_SKY_PATHS: Readonly<Record<Exclude<TimeSlot, 'afternoon'>, string>> = {
  morning: 'assets/environments/boulevard-v3/sky-morning.webp',
  evening: 'assets/environments/boulevard-v3/sky-evening.webp',
};

/** The colour grade for one time of day, laid over the whole picture (the player and props included, under the vignette):
 * `multiply` darkens and tints it (white leaves it alone) and `glow` is light added back on top, at `glowAlpha`. Colours are 0xRRGGBB. */
export interface TimeLook {
  readonly multiply: number;
  readonly glow: number;
  readonly glowAlpha: number;
}

export const TIME_LOOKS: Readonly<Record<TimeSlot, TimeLook>> = {
  // Cool, a little dim and hazy: the added pale blue lifts the shadows, which flattens contrast and mutes colour.
  morning: { multiply: 0xe6edf6, glow: 0xb8c6dc, glowAlpha: 0.08 },
  // The scene as drawn.
  afternoon: { multiply: 0xffffff, glow: 0xffffff, glowAlpha: 0 },
  // Golden hour, kept gentle: a touch warmer than the afternoon, with a low amber wash (option B of the 2026-10-01 review).
  evening: { multiply: 0xffe6c8, glow: 0xffb454, glowAlpha: 0.05 },
};

function channel(color: number, shift: number): number {
  return (color >> shift) & 0xff;
}

export function lerpColor(from: number, to: number, t: number): number {
  const mix = (shift: number): number => Math.round(channel(from, shift) + (channel(to, shift) - channel(from, shift)) * t);
  return (mix(16) << 16) | (mix(8) << 8) | mix(0);
}

export function blendLooks(from: TimeLook, to: TimeLook, t: number): TimeLook {
  return {
    multiply: lerpColor(from.multiply, to.multiply, t),
    glow: lerpColor(from.glow, to.glow, t),
    glowAlpha: from.glowAlpha + (to.glowAlpha - from.glowAlpha) * t,
  };
}

/** Smooth in and out, so the blend starts and ends gently instead of at full speed. */
export function easeInOut(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/** When, in ms from the start of a time change, each of `count` building lights switches. Lights switch instantly (a bulb is on or off),
 * not fade, but not all in the same instant either: they are spread over `spreadMs` centred on the middle of the blend, in a fixed
 * order (golden-ratio spacing) so the street does not switch in unison and the same light always goes at the same moment. */
export function lightFlipTimes(count: number, fadeMs: number = TIME_FADE_MS, spreadMs = 1000): number[] {
  return Array.from({ length: count }, (_, index) => {
    const unit = (index * 0.6180339887) % 1;
    return Math.round(fadeMs / 2 + (unit - 0.5) * spreadMs);
  });
}
