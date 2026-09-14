export interface ResourcesState {
  readonly money: number;
  readonly energy: number;
  readonly reputation: number;
}

const MAX_ENERGY = 100;
const MAX_REPUTATION = 100;

export const DEFAULT_RESOURCES: ResourcesState = Object.freeze({ money: 12, energy: MAX_ENERGY, reputation: 0 });

export interface ResourceDelta {
  readonly money?: number;
  readonly energy?: number;
  readonly reputation?: number;
}

/** Money floors at 0; energy and reputation clamp to [0, 100] per the GDD's
 * "Core resources" section — overextension creates tradeoffs, not hard
 * failure or unbounded accumulation. */
export function applyResourceDelta(resources: ResourcesState, delta: ResourceDelta): ResourcesState {
  return {
    money: Math.max(0, resources.money + (delta.money ?? 0)),
    energy: clamp(resources.energy + (delta.energy ?? 0), 0, MAX_ENERGY),
    reputation: clamp(resources.reputation + (delta.reputation ?? 0), 0, MAX_REPUTATION),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
