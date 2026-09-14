import { describe, expect, it } from 'vitest';

import { applyResourceDelta, DEFAULT_RESOURCES } from '../src/domain/EconomySystem';

describe('economy system', () => {
  it('accumulates positive deltas', () => {
    expect(applyResourceDelta(DEFAULT_RESOURCES, { money: 5, reputation: 10 })).toEqual({
      money: 17,
      energy: 100,
      reputation: 10,
    });
  });

  it('floors money at 0 instead of going negative', () => {
    expect(applyResourceDelta(DEFAULT_RESOURCES, { money: -50 }).money).toBe(0);
  });

  it('clamps energy to the [0, 100] range', () => {
    expect(applyResourceDelta(DEFAULT_RESOURCES, { energy: -500 }).energy).toBe(0);
    expect(applyResourceDelta(DEFAULT_RESOURCES, { energy: 500 }).energy).toBe(100);
  });

  it('clamps reputation to the [0, 100] range', () => {
    expect(applyResourceDelta(DEFAULT_RESOURCES, { reputation: -500 }).reputation).toBe(0);
    expect(applyResourceDelta({ ...DEFAULT_RESOURCES, reputation: 95 }, { reputation: 500 }).reputation).toBe(100);
  });

  it('leaves fields unspecified in the delta unchanged', () => {
    expect(applyResourceDelta(DEFAULT_RESOURCES, {})).toEqual(DEFAULT_RESOURCES);
  });
});
