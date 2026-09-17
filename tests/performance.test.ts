import { describe, expect, it } from 'vitest';

import { createDefaultCareerState, type CareerState } from '../src/domain/CareerState';
import { DEFAULT_ATTRIBUTES, type AttributesState } from '../src/domain/Origins';
import {
  applyAuditionOutcome,
  resolveAudition,
  type AuditionChoices,
  type AuditionDefinition,
} from '../src/domain/Performance';
import { DEFAULT_PROGRESSION, type ProgressionState } from '../src/domain/Progression';
import { applyRelationshipDelta, type RelationshipCharacter, type RelationshipState } from '../src/domain/Relationships';
import type { InventoryItemDefinition } from '../src/domain/Inventory';

const SCENE_PARTNER: RelationshipCharacter = { id: 'scene-partner', supportsAttraction: true };
const OTHER_CHARACTER: RelationshipCharacter = { id: 'other', supportsAttraction: false };
const ROSTER: RelationshipCharacter[] = [SCENE_PARTNER, OTHER_CHARACTER];

const PREP_ITEM: InventoryItemDefinition = {
  id: 'prepared-prop',
  category: 'prop',
  name: 'Prepared Prop',
  description: '',
  unlockSource: 'debug',
};
const ITEMS: InventoryItemDefinition[] = [PREP_ITEM];

const DEFINITION: AuditionDefinition = {
  id: 'test-audition',
  title: 'Test Audition',
  featuredAttribute: 'craft',
  scenePartnerId: SCENE_PARTNER.id,
  preparationChecks: [
    { condition: { kind: 'fact', fact: 'studied-the-script' }, label: 'Studied the script.', points: 2 },
    { condition: { kind: 'item-owned', itemId: 'prepared-prop' }, label: 'Brought the prop.', points: 1 },
  ],
  categories: [
    {
      kind: 'intention',
      prompt: 'Intention?',
      options: [
        { id: 'strong-craft', label: 'Lean on craft.', fit: 2, attribute: 'craft' },
        { id: 'off-attribute', label: 'Lean on nerve.', fit: 2, attribute: 'nerve' },
        { id: 'trained', label: 'Use the trained technique.', fit: 1, talentId: 'test-talent' },
      ],
    },
    {
      kind: 'improvisation',
      prompt: 'Improvise?',
      options: [{ id: 'hold-the-line', label: 'Stick to the script.', fit: 0 }],
    },
  ],
  outcomeEffects: {
    breakthrough: [
      { kind: 'resource-delta', delta: { reputation: 15 } },
      { kind: 'xp-grant', amount: 40 },
      { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { trust: 10 } },
      { kind: 'set-fact', fact: 'outcome:breakthrough' },
    ],
    'promising-complication': [{ kind: 'set-fact', fact: 'outcome:promising-complication' }],
    'wrong-role-right-notice': [{ kind: 'set-fact', fact: 'outcome:wrong-role-right-notice' }],
    'memorable-setback': [{ kind: 'set-fact', fact: 'outcome:memorable-setback' }],
  },
};

function stateWith(overrides: {
  attributes?: AttributesState;
  facts?: Readonly<Record<string, boolean>>;
  relationships?: RelationshipState;
  progression?: ProgressionState;
  ownedItemIds?: Readonly<Record<string, boolean>>;
}): CareerState {
  const base = createDefaultCareerState();
  return {
    ...base,
    attributes: overrides.attributes ?? base.attributes,
    facts: overrides.facts ?? base.facts,
    relationships: overrides.relationships ?? base.relationships,
    progression: overrides.progression ?? base.progression,
    inventory: { ownedItemIds: overrides.ownedItemIds ?? {} },
  };
}

describe('resolveAudition', () => {
  it('scores nothing and lands wrong-role-right-notice with no preparation, no choices, and default attributes', () => {
    const state = stateWith({});
    const result = resolveAudition(state, DEFINITION, {}, ROSTER, ITEMS);
    expect(result.score).toBe(0);
    expect(result.outcome).toBe('wrong-role-right-notice');
    expect(result.factors).toEqual([]);
  });

  it('credits satisfied preparation checks and ignores unsatisfied ones', () => {
    const state = stateWith({ facts: { 'studied-the-script': true } });
    const result = resolveAudition(state, DEFINITION, {}, ROSTER, ITEMS);
    expect(result.score).toBe(2);
    expect(result.factors).toContainEqual({ label: 'Studied the script.', points: 2 });
  });

  it('credits an item-owned preparation check', () => {
    const state = stateWith({ ownedItemIds: { 'prepared-prop': true } });
    const result = resolveAudition(state, DEFINITION, {}, ROSTER, ITEMS);
    expect(result.score).toBe(1);
    expect(result.factors).toContainEqual({ label: 'Brought the prop.', points: 1 });
  });

  it('ignores a category the player left unanswered', () => {
    const state = stateWith({});
    const choices: AuditionChoices = {};
    const result = resolveAudition(state, DEFINITION, choices, ROSTER, ITEMS);
    expect(result.score).toBe(0);
  });

  it('adds an option fit and an attribute bonus above baseline', () => {
    const state = stateWith({ attributes: { ...DEFAULT_ATTRIBUTES, craft: 8 } });
    const choices: AuditionChoices = { intention: 'strong-craft' };
    const result = resolveAudition(state, DEFINITION, choices, ROSTER, ITEMS);
    // fit 2, plus (8 - 5) = 3 attribute points
    expect(result.score).toBe(5);
    expect(result.factors).toContainEqual({ label: 'Lean on craft.', points: 2 });
    expect(result.factors).toContainEqual({ label: 'Craft carried it', points: 3 });
  });

  it('subtracts an attribute penalty below baseline', () => {
    const state = stateWith({ attributes: { ...DEFAULT_ATTRIBUTES, craft: 3 } });
    const choices: AuditionChoices = { intention: 'strong-craft' };
    const result = resolveAudition(state, DEFINITION, choices, ROSTER, ITEMS);
    expect(result.score).toBe(0); // fit 2, minus (5 - 3) = 2
  });

  it('adds a flat bonus when the chosen option cites an unlocked talent', () => {
    const state = stateWith({
      progression: { ...DEFAULT_PROGRESSION, unlockedTalentIds: { 'test-talent': true } },
    });
    const choices: AuditionChoices = { intention: 'trained' };
    const result = resolveAudition(state, DEFINITION, choices, ROSTER, ITEMS);
    expect(result.score).toBe(3); // fit 1 + talent bonus 2
    expect(result.factors).toContainEqual({ label: 'Trained technique paid off', points: 2 });
  });

  it('does not grant the talent bonus when the talent is not unlocked', () => {
    const state = stateWith({});
    const choices: AuditionChoices = { intention: 'trained' };
    const result = resolveAudition(state, DEFINITION, choices, ROSTER, ITEMS);
    expect(result.score).toBe(1); // fit only
  });

  it('adds a scene-partner trust bonus', () => {
    const state = stateWith({ relationships: applyRelationshipDelta({}, SCENE_PARTNER, { trust: 50 }) });
    const result = resolveAudition(state, DEFINITION, {}, ROSTER, ITEMS);
    expect(result.score).toBe(2); // round(50 / 25)
    expect(result.factors).toContainEqual({ label: 'Your scene partner has your back', points: 2 });
  });

  it('treats a dangling scenePartnerId as contributing nothing rather than throwing', () => {
    const definition: AuditionDefinition = { ...DEFINITION, scenePartnerId: 'missing' };
    const state = stateWith({});
    expect(() => resolveAudition(state, definition, {}, ROSTER, ITEMS)).not.toThrow();
  });

  it('sorts factors by descending magnitude', () => {
    const state = stateWith({
      facts: { 'studied-the-script': true },
      attributes: { ...DEFAULT_ATTRIBUTES, craft: 8 },
    });
    const choices: AuditionChoices = { intention: 'strong-craft' };
    const result = resolveAudition(state, DEFINITION, choices, ROSTER, ITEMS);
    const magnitudes = result.factors.map((factor) => Math.abs(factor.points));
    expect(magnitudes).toEqual([...magnitudes].sort((a, b) => b - a));
  });

  describe('outcome thresholds', () => {
    it('reaches breakthrough with a high score and no scene-partner tension', () => {
      const state = stateWith({
        facts: { 'studied-the-script': true },
        ownedItemIds: { 'prepared-prop': true },
        attributes: { ...DEFAULT_ATTRIBUTES, craft: 8 },
      });
      const result = resolveAudition(state, DEFINITION, { intention: 'strong-craft' }, ROSTER, ITEMS);
      expect(result.score).toBeGreaterThanOrEqual(8);
      expect(result.outcome).toBe('breakthrough');
    });

    it('downgrades an otherwise-breakthrough score to promising-complication under high scene-partner tension', () => {
      const state = stateWith({
        facts: { 'studied-the-script': true },
        ownedItemIds: { 'prepared-prop': true },
        attributes: { ...DEFAULT_ATTRIBUTES, craft: 8 },
        relationships: applyRelationshipDelta({}, SCENE_PARTNER, { tension: 60 }),
      });
      const result = resolveAudition(state, DEFINITION, { intention: 'strong-craft' }, ROSTER, ITEMS);
      expect(result.score).toBeGreaterThanOrEqual(8);
      expect(result.outcome).toBe('promising-complication');
    });

    it('lands wrong-role-right-notice in the mid band when choices lean off the featured attribute', () => {
      const state = stateWith({ attributes: { ...DEFAULT_ATTRIBUTES, nerve: 8 } });
      const result = resolveAudition(state, DEFINITION, { intention: 'off-attribute' }, ROSTER, ITEMS);
      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(result.score).toBeLessThan(8);
      expect(result.outcome).toBe('wrong-role-right-notice');
    });

    it('lands promising-complication in the mid band when choices lean on the featured attribute', () => {
      const state = stateWith({ attributes: { ...DEFAULT_ATTRIBUTES, craft: 7 } });
      const result = resolveAudition(state, DEFINITION, { intention: 'strong-craft' }, ROSTER, ITEMS);
      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(result.score).toBeLessThan(8);
      expect(result.outcome).toBe('promising-complication');
    });

    it('falls to memorable-setback on a negative score', () => {
      const state = stateWith({ attributes: { ...DEFAULT_ATTRIBUTES, craft: 1 } });
      const result = resolveAudition(state, DEFINITION, { intention: 'strong-craft' }, ROSTER, ITEMS);
      expect(result.score).toBeLessThan(0);
      expect(result.outcome).toBe('memorable-setback');
    });
  });
});

describe('applyAuditionOutcome', () => {
  it('applies the resolved outcome family’s authored effects', () => {
    const state = stateWith({});
    const result = resolveAudition(state, DEFINITION, {}, ROSTER, ITEMS);
    expect(result.outcome).toBe('wrong-role-right-notice');
    const next = applyAuditionOutcome(state, DEFINITION, result, ROSTER);
    expect(next.facts['outcome:wrong-role-right-notice']).toBe(true);
    expect(next.facts['outcome:breakthrough']).toBeUndefined();
  });

  it('applies a mix of resource, xp, and relationship effects for breakthrough', () => {
    const state = stateWith({
      facts: { 'studied-the-script': true },
      ownedItemIds: { 'prepared-prop': true },
      attributes: { ...DEFAULT_ATTRIBUTES, craft: 8 },
    });
    const result = resolveAudition(state, DEFINITION, { intention: 'strong-craft' }, ROSTER, ITEMS);
    expect(result.outcome).toBe('breakthrough');
    const next = applyAuditionOutcome(state, DEFINITION, result, ROSTER);
    expect(next.resources.reputation).toBe(state.resources.reputation + 15);
    expect(next.progression.xp + next.progression.level).not.toBe(state.progression.xp + state.progression.level); // xp applied (may have leveled)
    expect(next.relationships[SCENE_PARTNER.id]?.trust).toBe(10);
    expect(next.facts['outcome:breakthrough']).toBe(true);
  });
});
