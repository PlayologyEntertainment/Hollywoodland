import { applyResourceDelta } from './EconomySystem';
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
