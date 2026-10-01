import { describe, expect, it } from 'vitest';

import { createDefaultCareerState, isCareerStateShape, type CareerState } from '../src/domain/CareerState';
import {
  currentRegion,
  DEFAULT_REGION,
  FAR_TRIP,
  getRegionById,
  NEAR_TRIP,
  REGIONS,
  travelQuote,
  travelStatus,
  travelTo,
  type RegionId,
} from '../src/domain/Travel';

/** A state with the named regions built, so travel can be exercised before the real places exist. */
function withMoney(money: number, region?: RegionId): CareerState {
  const base = createDefaultCareerState();
  return { ...base, resources: { ...base.resources, money }, ...(region !== undefined ? { region } : {}) };
}

describe('the regions', () => {
  it('are the five places on the map, with only the Boulevard built so far', () => {
    expect(REGIONS.map((region) => region.id)).toEqual(['hollywood-boulevard', 'hollywood-bowl', 'santa-monica-pier', 'griffith-observatory', 'monarch-lot']);
    expect(REGIONS.filter((region) => region.playable).map((region) => region.id)).toEqual(['hollywood-boulevard']);
  });

  it('carry the 1930 census populations their welcome signs show', () => {
    expect(getRegionById('hollywood-boulevard')?.population).toBe(1_238_048);
    expect(getRegionById('santa-monica-pier')?.population).toBe(37_146);
    expect(getRegionById('monarch-lot')?.population).toBe(5_669);
    for (const region of REGIONS) expect(region.population, region.id).toBeGreaterThan(0);
  });
});

describe('where the player is', () => {
  it('is the Boulevard for a new career and for a save with no region', () => {
    expect(DEFAULT_REGION).toBe('hollywood-boulevard');
    expect(currentRegion(createDefaultCareerState())).toBe('hollywood-boulevard');
    expect(currentRegion({ region: 'not-a-place' })).toBe('hollywood-boulevard');
    expect(currentRegion({ region: 'santa-monica-pier' })).toBe('santa-monica-pier');
  });

  it('is still a valid career state with or without a region, and rejects one that is not text', () => {
    expect(isCareerStateShape(createDefaultCareerState())).toBe(true);
    expect(isCareerStateShape({ ...createDefaultCareerState(), region: 'hollywood-bowl' })).toBe(true);
    expect(isCareerStateShape({ ...createDefaultCareerState(), region: 3 })).toBe(false);
  });
});

describe('travelQuote', () => {
  it('is $2 and one time slot within the city and hills, and $5 and two to or from the coast', () => {
    expect(NEAR_TRIP).toEqual({ fare: 2, slots: 1 });
    expect(FAR_TRIP).toEqual({ fare: 5, slots: 2 });
    expect(travelQuote('hollywood-boulevard', 'hollywood-bowl')).toEqual(NEAR_TRIP);
    expect(travelQuote('griffith-observatory', 'monarch-lot')).toEqual(NEAR_TRIP);
    expect(travelQuote('hollywood-boulevard', 'santa-monica-pier')).toEqual(FAR_TRIP);
    expect(travelQuote('santa-monica-pier', 'griffith-observatory')).toEqual(FAR_TRIP);
  });

  it('has no trip to the place you are already in', () => {
    expect(travelQuote('hollywood-bowl', 'hollywood-bowl')).toBeUndefined();
  });
});

describe('travelStatus', () => {
  it('says here for the current region, and coming soon for an unbuilt one, even with plenty of money', () => {
    expect(travelStatus(withMoney(100), 'hollywood-boulevard')).toBe('here');
    expect(travelStatus(withMoney(100), 'hollywood-bowl')).toBe('coming-soon');
    expect(travelStatus(withMoney(100), 'santa-monica-pier')).toBe('coming-soon');
  });

  it('reports a built region as ready only when the fare can be paid (checked with the Bowl treated as built)', () => {
    const bowl = getRegionById('hollywood-bowl');
    if (bowl === undefined) throw new Error('no bowl');
    const original = bowl.playable;
    (bowl as { playable: boolean }).playable = true;
    try {
      expect(travelStatus(withMoney(1), 'hollywood-bowl')).toBe('cannot-afford');
      expect(travelStatus(withMoney(2), 'hollywood-bowl')).toBe('ready');
    } finally {
      (bowl as { playable: boolean }).playable = original;
    }
  });
});

describe('travelTo', () => {
  function playable<T>(ids: readonly RegionId[], run: () => T): T {
    const regions = ids.map((id) => getRegionById(id) as { playable: boolean });
    const originals = regions.map((region) => region.playable);
    regions.forEach((region) => { region.playable = true; });
    try {
      return run();
    } finally {
      regions.forEach((region, index) => { region.playable = originals[index] as boolean; });
    }
  }

  it('pays the fare, moves the clock on one slot, records the region and leaves Energy alone', () => {
    playable(['hollywood-bowl'], () => {
      const before = withMoney(12);
      const after = travelTo(before, 'hollywood-bowl');
      expect(after.region).toBe('hollywood-bowl');
      expect(after.resources.money).toBe(10);
      expect(after.resources.energy).toBe(before.resources.energy);
      expect(after.time).toEqual({ day: 1, slot: 'afternoon' });
    });
  });

  it('takes two slots and $5 to the coast, rolling over into the next day when it has to', () => {
    playable(['santa-monica-pier'], () => {
      const evening: CareerState = { ...withMoney(12), time: { day: 1, slot: 'evening' } };
      const after = travelTo(evening, 'santa-monica-pier');
      expect(after.resources.money).toBe(7);
      expect(after.time).toEqual({ day: 2, slot: 'afternoon' });
    });
  });

  it('does nothing when the trip is not allowed: unbuilt, here, or too poor', () => {
    const state = withMoney(12);
    expect(travelTo(state, 'hollywood-bowl')).toBe(state);
    expect(travelTo(state, 'hollywood-boulevard')).toBe(state);
    playable(['hollywood-bowl'], () => {
      const poor = withMoney(1);
      expect(travelTo(poor, 'hollywood-bowl')).toBe(poor);
    });
  });
});
