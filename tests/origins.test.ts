import { describe, expect, it } from 'vitest';

import { BASE_ATTRIBUTE_VALUE, deriveAttributes, ORIGINS } from '../src/domain/Origins';

/** Owner request: the original ±1 swing left every origin's final attributes within 4-6 of each other (base 5) — too
 * close to read as distinct builds. Widened to ±3 (values now 2-8), keeping each origin a zero-sum trade of exactly one
 * strength for one weakness, same attribute pairs and direction as before. See the comment above ORIGINS in
 * src/domain/Origins.ts, and docs/DRAFT_TRACK_B_CANON_PROPOSAL.md §3, for the full rationale. */
describe('an Origin\'s attribute deltas', () => {
  it('trade exactly one attribute up and one down, by the same amount, for every origin', () => {
    for (const origin of ORIGINS) {
      const values = Object.values(origin.deltas);
      expect(values, origin.id).toHaveLength(2);
      const [first, second] = values as [number, number];
      expect(first + second, origin.id).toBe(0);
      expect(Math.abs(first), origin.id).toBe(3);
    }
  });

  it('land every attribute within 2-8 (base 5, swung by ±3) -- clearly apart, nowhere near the 0-10 display bar\'s ends', () => {
    for (const origin of ORIGINS) {
      const attributes = deriveAttributes(origin.id);
      for (const value of Object.values(attributes)) {
        expect(value, origin.id).toBeGreaterThanOrEqual(BASE_ATTRIBUTE_VALUE - 3);
        expect(value, origin.id).toBeLessThanOrEqual(BASE_ATTRIBUTE_VALUE + 3);
      }
    }
  });

  it('give each origin its own distinct pair of raised/lowered attributes', () => {
    expect(ORIGINS.map((origin) => origin.deltas)).toEqual([
      { grit: 3, wit: -3 }, // Small-Town Hopeful
      { craft: 3, grit: -3 }, // Vaudeville Trouper
      { presence: 3, wit: -3 }, // Runaway Society Name (was presence-only before this change)
      { grit: 3, presence: -3 }, // Immigrant Striver
      { wit: 3, nerve: -3 }, // Studio-Lot Hand-Me-Down
    ]);
  });
});
