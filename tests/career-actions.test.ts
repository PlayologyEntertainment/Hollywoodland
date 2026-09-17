import { describe, expect, it } from 'vitest';

import {
  advanceTime,
  CASTING_OFFICE_ENERGY_COST,
  CASTING_OFFICE_REPUTATION_GAIN,
  enterCastingOffice,
  purchaseHousingUpgrade,
  WAIT_ENERGY_RESTORE,
} from '../src/domain/CareerActions';
import { createDefaultCareerState, type CareerState } from '../src/domain/CareerState';

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

  it('does not upgrade housing without enough money', () => {
    const state = createDefaultCareerState();
    expect(purchaseHousingUpgrade(state)).toBe(state);
  });

  it('upgrades housing and spends the cost when affordable', () => {
    const state: CareerState = {
      ...createDefaultCareerState(),
      resources: { ...createDefaultCareerState().resources, money: 150 },
    };
    const next = purchaseHousingUpgrade(state);
    expect(next.housing.tier).toBe('apartment');
    expect(next.resources.money).toBe(0);
  });

  it('does not upgrade past the top housing tier', () => {
    const state: CareerState = {
      ...createDefaultCareerState(),
      housing: { tier: 'mansion' },
      resources: { ...createDefaultCareerState().resources, money: 999_999 },
    };
    expect(purchaseHousingUpgrade(state)).toBe(state);
  });
});
