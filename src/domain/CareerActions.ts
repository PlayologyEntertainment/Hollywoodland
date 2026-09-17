import { applyResourceDelta } from './EconomySystem';
import { canAffordHousingUpgrade, nextHousingTierDefinition, upgradeHousingTier } from './Housing';
import { advanceTimeSlot } from './TimeSystem';
import type { CareerState } from './CareerState';

export const CASTING_OFFICE_ENERGY_COST = 15;
export const CASTING_OFFICE_REPUTATION_GAIN = 5;
export const WAIT_ENERGY_RESTORE = 20;

/** Idempotent: only the first visit charges energy and grants reputation,
 * so re-entering the casting office (the dialog can still reopen) never
 * double-charges the player. */
export function enterCastingOffice(state: CareerState): CareerState {
  if (state.flags.discoveredCastingOffice) return state;
  return {
    ...state,
    flags: { ...state.flags, discoveredCastingOffice: true },
    resources: applyResourceDelta(state.resources, {
      energy: -CASTING_OFFICE_ENERGY_COST,
      reputation: CASTING_OFFICE_REPUTATION_GAIN,
    }),
  };
}

/** Backs the HUD's "Wait" action: advances the time slot and restores some
 * energy, per the GDD's flexible time-slot economy. */
export function advanceTime(state: CareerState): CareerState {
  return {
    ...state,
    time: advanceTimeSlot(state.time),
    resources: applyResourceDelta(state.resources, { energy: WAIT_ENERGY_RESTORE }),
  };
}

/** No-ops when the player can't afford the next housing tier, or is already
 * at the top one — the same defensive posture `unlockTalent` takes toward
 * an unaffordable or already-maxed action. Spends the money and moves the
 * tier marker in the same step, mirroring how `unlockTalent` spends a point
 * and applies its attribute bonus together. */
export function purchaseHousingUpgrade(state: CareerState): CareerState {
  if (!canAffordHousingUpgrade(state.housing, state.resources)) return state;
  const next = nextHousingTierDefinition(state.housing.tier);
  if (next === undefined || next.upgradeCost === null) return state;
  return {
    ...state,
    housing: upgradeHousingTier(state.housing),
    resources: applyResourceDelta(state.resources, { money: -next.upgradeCost }),
  };
}
