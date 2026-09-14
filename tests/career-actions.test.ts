import { describe, expect, it } from 'vitest';

import {
  advanceTime,
  CASTING_OFFICE_ENERGY_COST,
  CASTING_OFFICE_REPUTATION_GAIN,
  enterCastingOffice,
  WAIT_ENERGY_RESTORE,
} from '../src/domain/CareerActions';
import { createDefaultCareerState } from '../src/domain/CareerState';

describe('career actions', () => {
  it('charges energy and grants reputation on the first casting-office visit', () => {
    const state = createDefaultCareerState();
    const next = enterCastingOffice(state);
    expect(next.flags.discoveredCastingOffice).toBe(true);
    expect(next.resources.energy).toBe(state.resources.energy - CASTING_OFFICE_ENERGY_COST);
    expect(next.resources.reputation).toBe(state.resources.reputation + CASTING_OFFICE_REPUTATION_GAIN);
  });

  it('does not charge again on a repeat visit', () => {
    const state = createDefaultCareerState();
    const firstVisit = enterCastingOffice(state);
    const secondVisit = enterCastingOffice(firstVisit);
    expect(secondVisit).toEqual(firstVisit);
  });

  it('advances the time slot and restores energy', () => {
    const state = createDefaultCareerState();
    const next = advanceTime(state);
    expect(next.time).toEqual({ day: 1, slot: 'afternoon' });
    expect(next.resources.energy).toBe(Math.min(100, state.resources.energy + WAIT_ENERGY_RESTORE));
  });

  it('rolls the day over when waiting through evening', () => {
    const state = { ...createDefaultCareerState(), time: { day: 1, slot: 'evening' as const } };
    expect(advanceTime(state).time).toEqual({ day: 2, slot: 'morning' });
  });
});
