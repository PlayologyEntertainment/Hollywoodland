import { describe, expect, it } from 'vitest';

import { validateAuditions } from '../src/content/PerformanceValidator';
import type { InventoryItemDefinition } from '../src/domain/Inventory';
import { ALL_ITEMS } from '../src/domain/InventoryDefinitions';
import type { AuditionDefinition } from '../src/domain/Performance';
import { ALL_AUDITIONS } from '../src/domain/PerformanceDefinitions';
import type { TalentDefinition } from '../src/domain/Progression';
import { ALL_TALENTS } from '../src/domain/TalentDefinitions';
import { ALL_RELATIONSHIP_CHARACTERS } from '../src/domain/RelationshipDefinitions';
import type { RelationshipCharacter } from '../src/domain/Relationships';

const ROMANCE_CAPABLE: RelationshipCharacter = { id: 'romance-capable', supportsAttraction: true };
const ROMANCE_INCAPABLE: RelationshipCharacter = { id: 'romance-incapable', supportsAttraction: false };
const ROSTER: RelationshipCharacter[] = [ROMANCE_CAPABLE, ROMANCE_INCAPABLE];

const TEST_TALENT: TalentDefinition = {
  id: 'talent-a',
  branch: 'drama',
  name: 'Talent A',
  description: '',
  attribute: 'craft',
  attributeBonus: 1,
  cost: 1,
  prerequisiteId: null,
};

const TEST_ITEM: InventoryItemDefinition = {
  id: 'item-a',
  category: 'prop',
  name: 'Item A',
  description: '',
  unlockSource: 'debug',
};

function baseAudition(overrides: Partial<AuditionDefinition> = {}): AuditionDefinition {
  return {
    id: 'audition-a',
    title: 'Audition A',
    featuredAttribute: 'craft',
    scenePartnerId: 'romance-capable',
    preparationChecks: [],
    categories: [],
    outcomeEffects: {
      breakthrough: [],
      'promising-complication': [],
      'wrong-role-right-notice': [],
      'memorable-setback': [],
    },
    ...overrides,
  };
}

describe('validateAuditions', () => {
  it('accepts a minimal valid audition', () => {
    expect(() => validateAuditions([baseAudition()], ROSTER)).not.toThrow();
  });

  it('validates the real audition content against the real roster, talent, and item content', () => {
    expect(() => validateAuditions(ALL_AUDITIONS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS, ALL_ITEMS)).not.toThrow();
  });

  it('rejects a duplicate audition id', () => {
    const audition = baseAudition();
    expect(() => validateAuditions([audition, audition], ROSTER)).toThrow('duplicate id');
  });

  it('rejects a dangling scenePartnerId', () => {
    const audition = baseAudition({ scenePartnerId: 'missing' });
    expect(() => validateAuditions([audition], ROSTER)).toThrow('references missing scene partner "missing"');
  });

  it('rejects a duplicate category kind within one audition', () => {
    const audition = baseAudition({
      categories: [
        { kind: 'intention', prompt: '', options: [{ id: 'a', label: '', fit: 0 }] },
        { kind: 'intention', prompt: '', options: [{ id: 'b', label: '', fit: 0 }] },
      ],
    });
    expect(() => validateAuditions([audition], ROSTER)).toThrow('duplicate id');
  });

  it('rejects a duplicate option id within one category', () => {
    const audition = baseAudition({
      categories: [
        {
          kind: 'intention',
          prompt: '',
          options: [
            { id: 'a', label: '', fit: 0 },
            { id: 'a', label: '', fit: 1 },
          ],
        },
      ],
    });
    expect(() => validateAuditions([audition], ROSTER)).toThrow('duplicate id');
  });

  it('rejects an option referencing a missing talent', () => {
    const audition = baseAudition({
      categories: [{ kind: 'intention', prompt: '', options: [{ id: 'a', label: '', fit: 0, talentId: 'missing' }] }],
    });
    expect(() => validateAuditions([audition], ROSTER)).toThrow('references missing talent "missing"');
  });

  it('accepts an option referencing a known talent', () => {
    const audition = baseAudition({
      categories: [{ kind: 'intention', prompt: '', options: [{ id: 'a', label: '', fit: 0, talentId: 'talent-a' }] }],
    });
    expect(() => validateAuditions([audition], ROSTER, [TEST_TALENT])).not.toThrow();
  });

  it('rejects a preparation check referencing a missing item', () => {
    const audition = baseAudition({
      preparationChecks: [{ condition: { kind: 'item-owned', itemId: 'missing' }, label: '', points: 1 }],
    });
    expect(() => validateAuditions([audition], ROSTER)).toThrow('references missing item "missing"');
  });

  it('accepts a preparation check referencing a known item', () => {
    const audition = baseAudition({
      preparationChecks: [{ condition: { kind: 'item-owned', itemId: 'item-a' }, label: '', points: 1 }],
    });
    expect(() => validateAuditions([audition], ROSTER, [], [TEST_ITEM])).not.toThrow();
  });

  it('accepts a fact-based preparation check without needing an items list', () => {
    const audition = baseAudition({
      preparationChecks: [{ condition: { kind: 'fact', fact: 'studied' }, label: '', points: 1 }],
    });
    expect(() => validateAuditions([audition], ROSTER)).not.toThrow();
  });

  it('rejects an outcome effect referencing a missing relationship character', () => {
    const audition = baseAudition({
      outcomeEffects: {
        breakthrough: [{ kind: 'relationship-delta', characterId: 'missing', delta: { trust: 5 } }],
        'promising-complication': [],
        'wrong-role-right-notice': [],
        'memorable-setback': [],
      },
    });
    expect(() => validateAuditions([audition], ROSTER)).toThrow(
      'outcome "breakthrough" effect references missing relationship character "missing"',
    );
  });

  it('rejects an attraction delta against a character that does not support it', () => {
    const audition = baseAudition({
      scenePartnerId: 'romance-incapable',
      outcomeEffects: {
        breakthrough: [{ kind: 'relationship-delta', characterId: 'romance-incapable', delta: { attraction: 5 } }],
        'promising-complication': [],
        'wrong-role-right-notice': [],
        'memorable-setback': [],
      },
    });
    expect(() => validateAuditions([audition], ROSTER)).toThrow('does not support it');
  });

  it('accepts a relationship-pivotal-flag effect against a known character', () => {
    const audition = baseAudition({
      outcomeEffects: {
        breakthrough: [{ kind: 'relationship-pivotal-flag', characterId: 'romance-capable', flag: 'flag' }],
        'promising-complication': [],
        'wrong-role-right-notice': [],
        'memorable-setback': [],
      },
    });
    expect(() => validateAuditions([audition], ROSTER)).not.toThrow();
  });
});
