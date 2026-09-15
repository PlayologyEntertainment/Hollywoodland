import { describe, expect, it } from 'vitest';

import {
  applyXpGain,
  canUnlockTalent,
  DEFAULT_PROGRESSION,
  isTalentUnlocked,
  unlockTalent,
  xpRequiredForNextLevel,
  type ProgressionState,
  type TalentDefinition,
} from '../src/domain/Progression';
import { MAX_ATTRIBUTE_VALUE } from '../src/domain/Origins';
import { createDefaultCareerState, type CareerState } from '../src/domain/CareerState';

const TIER_1: TalentDefinition = {
  id: 'tier-1',
  branch: 'drama',
  name: 'Tier 1',
  description: '',
  attribute: 'craft',
  attributeBonus: 1,
  cost: 1,
  prerequisiteId: null,
};

const TIER_2: TalentDefinition = {
  id: 'tier-2',
  branch: 'drama',
  name: 'Tier 2',
  description: '',
  attribute: 'craft',
  attributeBonus: 1,
  cost: 2,
  prerequisiteId: 'tier-1',
};

function careerStateWithProgression(progression: ProgressionState): CareerState {
  return { ...createDefaultCareerState(), progression };
}

describe('xpRequiredForNextLevel', () => {
  it('grows with each level', () => {
    expect(xpRequiredForNextLevel(1)).toBe(40);
    expect(xpRequiredForNextLevel(2)).toBe(60);
    expect(xpRequiredForNextLevel(3)).toBe(80);
  });
});

describe('applyXpGain', () => {
  it('accumulates xp below the next threshold without leveling up', () => {
    const next = applyXpGain(DEFAULT_PROGRESSION, 20);
    expect(next).toMatchObject({ xp: 20, level: 1, unspentTalentPoints: 0 });
  });

  it('levels up once, carrying the remainder and granting a talent point', () => {
    const next = applyXpGain(DEFAULT_PROGRESSION, 50);
    expect(next).toMatchObject({ xp: 10, level: 2, unspentTalentPoints: 1 });
  });

  it('levels up multiple times from a single large gain', () => {
    const next = applyXpGain(DEFAULT_PROGRESSION, 40 + 60 + 15);
    expect(next).toMatchObject({ xp: 15, level: 3, unspentTalentPoints: 2 });
  });

  it('is a no-op for a zero or negative amount', () => {
    expect(applyXpGain(DEFAULT_PROGRESSION, 0)).toBe(DEFAULT_PROGRESSION);
    expect(applyXpGain(DEFAULT_PROGRESSION, -5)).toBe(DEFAULT_PROGRESSION);
  });
});

describe('canUnlockTalent', () => {
  it('allows a prerequisite-free talent once enough points are available', () => {
    const progression: ProgressionState = { ...DEFAULT_PROGRESSION, unspentTalentPoints: 1 };
    expect(canUnlockTalent(progression, TIER_1)).toBe(true);
  });

  it('refuses when there are not enough unspent points', () => {
    expect(canUnlockTalent(DEFAULT_PROGRESSION, TIER_1)).toBe(false);
  });

  it('refuses a talent that is already unlocked', () => {
    const progression: ProgressionState = {
      ...DEFAULT_PROGRESSION,
      unspentTalentPoints: 5,
      unlockedTalentIds: { 'tier-1': true },
    };
    expect(canUnlockTalent(progression, TIER_1)).toBe(false);
  });

  it('refuses a talent whose prerequisite is not yet unlocked', () => {
    const progression: ProgressionState = { ...DEFAULT_PROGRESSION, unspentTalentPoints: 5 };
    expect(canUnlockTalent(progression, TIER_2)).toBe(false);
  });

  it('allows a talent once its prerequisite is unlocked', () => {
    const progression: ProgressionState = {
      ...DEFAULT_PROGRESSION,
      unspentTalentPoints: 5,
      unlockedTalentIds: { 'tier-1': true },
    };
    expect(canUnlockTalent(progression, TIER_2)).toBe(true);
  });
});

describe('isTalentUnlocked', () => {
  it('reflects the unlockedTalentIds record', () => {
    expect(isTalentUnlocked(DEFAULT_PROGRESSION, TIER_1)).toBe(false);
    expect(isTalentUnlocked({ ...DEFAULT_PROGRESSION, unlockedTalentIds: { 'tier-1': true } }, TIER_1)).toBe(true);
  });
});

describe('unlockTalent', () => {
  it('spends the point, marks the talent unlocked, and applies its attribute bonus', () => {
    const state = careerStateWithProgression({ ...DEFAULT_PROGRESSION, unspentTalentPoints: 1 });
    const baselineCraft = state.attributes.craft;
    const next = unlockTalent(state, TIER_1);
    expect(next.progression.unspentTalentPoints).toBe(0);
    expect(next.progression.unlockedTalentIds).toEqual({ 'tier-1': true });
    expect(next.attributes.craft).toBe(baselineCraft + 1);
  });

  it('clamps the attribute bonus at MAX_ATTRIBUTE_VALUE', () => {
    const state: CareerState = {
      ...careerStateWithProgression({ ...DEFAULT_PROGRESSION, unspentTalentPoints: 1 }),
      attributes: { ...createDefaultCareerState().attributes, craft: MAX_ATTRIBUTE_VALUE },
    };
    const next = unlockTalent(state, TIER_1);
    expect(next.attributes.craft).toBe(MAX_ATTRIBUTE_VALUE);
  });

  it('no-ops when the talent cannot be unlocked (insufficient points)', () => {
    const state = careerStateWithProgression(DEFAULT_PROGRESSION);
    expect(unlockTalent(state, TIER_1)).toBe(state);
  });

  it('no-ops when the prerequisite is missing', () => {
    const state = careerStateWithProgression({ ...DEFAULT_PROGRESSION, unspentTalentPoints: 5 });
    expect(unlockTalent(state, TIER_2)).toBe(state);
  });
});
