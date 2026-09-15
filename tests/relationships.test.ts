import { describe, expect, it } from 'vitest';

import {
  applyRelationshipAxesDelta,
  applyRelationshipDelta,
  createDefaultRelationshipAxes,
  deriveRelationshipLabel,
  getRelationshipAxes,
  getRelationshipLabel,
  setRelationshipPivotalFlag,
  type RelationshipAxes,
  type RelationshipCharacter,
  type RelationshipState,
} from '../src/domain/Relationships';

const ROMANCE_CAPABLE: RelationshipCharacter = { id: 'romance-capable', supportsAttraction: true };
const ROMANCE_INCAPABLE: RelationshipCharacter = { id: 'romance-incapable', supportsAttraction: false };

describe('createDefaultRelationshipAxes', () => {
  it('starts attraction at 0 for a romance-capable character', () => {
    expect(createDefaultRelationshipAxes(ROMANCE_CAPABLE).attraction).toBe(0);
  });

  it('starts attraction at null for a character that does not track it', () => {
    expect(createDefaultRelationshipAxes(ROMANCE_INCAPABLE).attraction).toBeNull();
  });

  it('starts trust, tension, obligation at zero and no pivotal flags', () => {
    const axes = createDefaultRelationshipAxes(ROMANCE_CAPABLE);
    expect(axes.trust).toBe(0);
    expect(axes.tension).toBe(0);
    expect(axes.obligation).toBe(0);
    expect(axes.pivotalFlags).toEqual({});
  });
});

describe('getRelationshipAxes', () => {
  it('falls back to the character default when the state has no entry yet', () => {
    const empty: RelationshipState = {};
    expect(getRelationshipAxes(empty, ROMANCE_CAPABLE)).toEqual(createDefaultRelationshipAxes(ROMANCE_CAPABLE));
  });

  it('returns the stored axes when present', () => {
    const stored: RelationshipAxes = { trust: 42, tension: 5, attraction: 10, obligation: -2, pivotalFlags: {} };
    const state: RelationshipState = { [ROMANCE_CAPABLE.id]: stored };
    expect(getRelationshipAxes(state, ROMANCE_CAPABLE)).toBe(stored);
  });
});

describe('applyRelationshipAxesDelta', () => {
  it('adds deltas to each numeric axis', () => {
    const axes = createDefaultRelationshipAxes(ROMANCE_CAPABLE);
    const next = applyRelationshipAxesDelta(axes, { trust: 10, tension: 5, attraction: 3, obligation: -4 });
    expect(next).toMatchObject({ trust: 10, tension: 5, attraction: 3, obligation: -4 });
  });

  it('clamps trust, tension, and attraction to [0, 100]', () => {
    const axes = createDefaultRelationshipAxes(ROMANCE_CAPABLE);
    const raised = applyRelationshipAxesDelta(axes, { trust: 1000, tension: 1000, attraction: 1000 });
    expect(raised).toMatchObject({ trust: 100, tension: 100, attraction: 100 });
    const lowered = applyRelationshipAxesDelta(raised, { trust: -1000, tension: -1000, attraction: -1000 });
    expect(lowered).toMatchObject({ trust: 0, tension: 0, attraction: 0 });
  });

  it('clamps obligation to [-20, 20]', () => {
    const axes = createDefaultRelationshipAxes(ROMANCE_CAPABLE);
    expect(applyRelationshipAxesDelta(axes, { obligation: 1000 }).obligation).toBe(20);
    expect(applyRelationshipAxesDelta(axes, { obligation: -1000 }).obligation).toBe(-20);
  });

  it('leaves attraction at null and ignores an attraction delta for a character that does not track it', () => {
    const axes = createDefaultRelationshipAxes(ROMANCE_INCAPABLE);
    expect(applyRelationshipAxesDelta(axes, { attraction: 50 }).attraction).toBeNull();
  });

  it('preserves existing pivotal flags', () => {
    const axes: RelationshipAxes = { ...createDefaultRelationshipAxes(ROMANCE_CAPABLE), pivotalFlags: { metAtDiner: true } };
    expect(applyRelationshipAxesDelta(axes, { trust: 5 }).pivotalFlags).toEqual({ metAtDiner: true });
  });
});

describe('applyRelationshipDelta', () => {
  it('stores the updated axes under the character id without disturbing others', () => {
    const other: RelationshipAxes = { trust: 7, tension: 0, attraction: null, obligation: 0, pivotalFlags: {} };
    const state: RelationshipState = { [ROMANCE_INCAPABLE.id]: other };
    const next = applyRelationshipDelta(state, ROMANCE_CAPABLE, { trust: 15 });
    expect(getRelationshipAxes(next, ROMANCE_CAPABLE).trust).toBe(15);
    expect(next[ROMANCE_INCAPABLE.id]).toBe(other);
  });
});

describe('setRelationshipPivotalFlag', () => {
  it('sets a flag to true by default and merges with existing flags', () => {
    const withFirst = setRelationshipPivotalFlag({}, ROMANCE_CAPABLE, 'metAtDiner');
    const withSecond = setRelationshipPivotalFlag(withFirst, ROMANCE_CAPABLE, 'witnessedBetrayal', false);
    expect(getRelationshipAxes(withSecond, ROMANCE_CAPABLE).pivotalFlags).toEqual({
      metAtDiner: true,
      witnessedBetrayal: false,
    });
  });
});

describe('deriveRelationshipLabel', () => {
  const base = createDefaultRelationshipAxes(ROMANCE_CAPABLE);

  it('is neutral by default', () => {
    expect(deriveRelationshipLabel(base)).toBe('neutral');
  });

  it('is friendship once trust is high and tension stays low', () => {
    expect(deriveRelationshipLabel({ ...base, trust: 75 })).toBe('friendship');
  });

  it('is rivalry once tension is high, even with moderate trust', () => {
    expect(deriveRelationshipLabel({ ...base, trust: 30, tension: 80 })).toBe('rivalry');
  });

  it('is estrangement once trust has broken down and tension is high', () => {
    expect(deriveRelationshipLabel({ ...base, trust: 10, tension: 80 })).toBe('estrangement');
  });

  it('is romance once attraction and trust both clear their thresholds', () => {
    expect(deriveRelationshipLabel({ ...base, trust: 50, attraction: 70 })).toBe('romance');
  });

  it('cannot be romance for a character whose attraction is null, however high trust runs', () => {
    const incapable = createDefaultRelationshipAxes(ROMANCE_INCAPABLE);
    expect(deriveRelationshipLabel({ ...incapable, trust: 100 })).toBe('friendship');
  });

  it('is alliance once the favor ledger runs deep in either direction alongside solid trust', () => {
    expect(deriveRelationshipLabel({ ...base, trust: 50, obligation: 15 })).toBe('alliance');
    expect(deriveRelationshipLabel({ ...base, trust: 50, obligation: -15 })).toBe('alliance');
  });

  it('prefers estrangement over rivalry when both thresholds are met', () => {
    expect(deriveRelationshipLabel({ ...base, trust: 5, tension: 90 })).toBe('estrangement');
  });

  it('prefers romance over alliance when both thresholds are met', () => {
    expect(deriveRelationshipLabel({ ...base, trust: 50, attraction: 80, obligation: 15 })).toBe('romance');
  });
});

describe('getRelationshipLabel', () => {
  it('derives the label from the stored (or default) axes for a character id', () => {
    const state = applyRelationshipDelta({}, ROMANCE_CAPABLE, { trust: 75 });
    expect(getRelationshipLabel(state, ROMANCE_CAPABLE)).toBe('friendship');
    expect(getRelationshipLabel({}, ROMANCE_CAPABLE)).toBe('neutral');
  });
});
