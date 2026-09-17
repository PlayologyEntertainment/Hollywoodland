import { describe, expect, it } from 'vitest';

import {
  canAffordHousingUpgrade,
  meetsHousingTier,
  nextHousingTierDefinition,
  upgradeHousingTier,
  type HousingState,
} from '../src/domain/Housing';
import { DEFAULT_RESOURCES } from '../src/domain/EconomySystem';

describe('housing', () => {
  it('meets a tier at or below its own', () => {
    const housing: HousingState = { tier: 'bungalow' };
    expect(meetsHousingTier(housing, 'room')).toBe(true);
    expect(meetsHousingTier(housing, 'apartment')).toBe(true);
    expect(meetsHousingTier(housing, 'bungalow')).toBe(true);
    expect(meetsHousingTier(housing, 'mansion')).toBe(false);
  });

  it('reports the next tier definition, and none past the top', () => {
    expect(nextHousingTierDefinition('room')?.tier).toBe('apartment');
    expect(nextHousingTierDefinition('mansion')).toBeUndefined();
  });

  it('cannot afford an upgrade without enough money', () => {
    const housing: HousingState = { tier: 'room' };
    expect(canAffordHousingUpgrade(housing, { ...DEFAULT_RESOURCES, money: 10 })).toBe(false);
  });

  it('can afford an upgrade with enough money', () => {
    const housing: HousingState = { tier: 'room' };
    expect(canAffordHousingUpgrade(housing, { ...DEFAULT_RESOURCES, money: 150 })).toBe(true);
  });

  it('cannot afford an upgrade at the top tier regardless of money', () => {
    const housing: HousingState = { tier: 'mansion' };
    expect(canAffordHousingUpgrade(housing, { ...DEFAULT_RESOURCES, money: 999_999 })).toBe(false);
  });

  it('moves to the next tier', () => {
    expect(upgradeHousingTier({ tier: 'room' })).toEqual({ tier: 'apartment' });
  });

  it('no-ops at the top tier', () => {
    const housing: HousingState = { tier: 'mansion' };
    expect(upgradeHousingTier(housing)).toEqual(housing);
  });
});
