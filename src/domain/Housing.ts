import type { ResourcesState } from './EconomySystem';

/** The GDD's housing progression (§ housing hub): room → apartment →
 * bungalow → mansion. Ties directly into idle-assignment availability — a
 * higher tier unlocks longer or more rewarding assignments, per
 * docs/GAME_DESIGN_DOCUMENT.md's "schedule planning, and idle assignments"
 * housing-hub note. */
export type HousingTier = 'room' | 'apartment' | 'bungalow' | 'mansion';

export const HOUSING_TIER_ORDER: readonly HousingTier[] = ['room', 'apartment', 'bungalow', 'mansion'];

export interface HousingState {
  readonly tier: HousingTier;
}

export const DEFAULT_HOUSING: HousingState = Object.freeze({ tier: 'room' });

export interface HousingTierDefinition {
  readonly tier: HousingTier;
  readonly label: string;
  /** Money cost to move up from the previous tier into this one; `null`
   * for the starting tier, which nothing upgrades into. */
  readonly upgradeCost: number | null;
}

export const HOUSING_TIERS: readonly HousingTierDefinition[] = [
  { tier: 'room', label: 'Boarding-house room', upgradeCost: null },
  { tier: 'apartment', label: 'Apartment', upgradeCost: 150 },
  { tier: 'bungalow', label: 'Bungalow', upgradeCost: 500 },
  { tier: 'mansion', label: 'Mansion', upgradeCost: 1500 },
];

export function housingTierIndex(tier: HousingTier): number {
  return HOUSING_TIER_ORDER.indexOf(tier);
}

/** Whether `housing` is at least `minimum` — the same "at least" comparator
 * shape as `evaluateProgressionCondition`'s `level-at-least`. */
export function meetsHousingTier(housing: HousingState, minimum: HousingTier): boolean {
  return housingTierIndex(housing.tier) >= housingTierIndex(minimum);
}

/** `undefined` once already at the top tier — the same "nothing left to
 * unlock" shape `getActiveStage` returns for a completed quest. */
export function nextHousingTierDefinition(tier: HousingTier): HousingTierDefinition | undefined {
  return HOUSING_TIERS[housingTierIndex(tier) + 1];
}

export function canAffordHousingUpgrade(housing: HousingState, resources: ResourcesState): boolean {
  const next = nextHousingTierDefinition(housing.tier);
  return next !== undefined && next.upgradeCost !== null && resources.money >= next.upgradeCost;
}

/** No-ops at the top tier, mirroring `unlockTalent`'s defensive posture
 * toward an action that's no longer available. Only moves the tier marker —
 * spending the money is `CareerActions.purchaseHousingUpgrade`'s job, the
 * same split `EconomySystem.applyResourceDelta` keeps from the actions that
 * call it. */
export function upgradeHousingTier(housing: HousingState): HousingState {
  const next = nextHousingTierDefinition(housing.tier);
  return next === undefined ? housing : { tier: next.tier };
}
