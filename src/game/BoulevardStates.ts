import type { CareerState } from '../domain/CareerState';
import type { BoulevardActiveRule } from './BoulevardManifest';

/** Whether a building should show its active-state art (open, lit, gate
 * raised) for the given career state: true when the current time slot is one
 * of the rule's slots, or when the rule's world flag is set. A building with
 * no rule is never active. Pure so the scene's texture swap can be tested
 * without Phaser. */
export function isBuildingActive(
  rule: BoulevardActiveRule | null,
  state: Pick<CareerState, 'time' | 'flags'>,
): boolean {
  if (rule === null) return false;
  if (rule.timeSlots.includes(state.time.slot)) return true;
  return rule.flag !== null && state.flags[rule.flag] === true;
}

/** The closest point whose radius contains `x`, or undefined. With the v3
 * street's doors closer together than the old layout's, "first match in list
 * order" would pick a neighbor's prompt; nearest-wins keeps the prompt on the
 * door the player is actually standing at. Ties keep the earlier point. */
export function nearestInteractable<T extends { readonly x: number; readonly radius: number }>(
  points: readonly T[],
  x: number,
): T | undefined {
  let best: T | undefined;
  let bestDistance = Infinity;
  for (const point of points) {
    const distance = Math.abs(x - point.x);
    if (distance < point.radius && distance < bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }
  return best;
}
