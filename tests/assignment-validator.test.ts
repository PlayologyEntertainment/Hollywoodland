import { describe, expect, it } from 'vitest';

import { validateAssignments } from '../src/content/AssignmentValidator';
import { ALL_ASSIGNMENTS } from '../src/domain/AssignmentDefinitions';
import type { AssignmentDefinition } from '../src/domain/Assignments';
import { ALL_RELATIONSHIP_CHARACTERS } from '../src/domain/RelationshipDefinitions';
import type { RelationshipCharacter } from '../src/domain/Relationships';

const ROMANCE_INCAPABLE: RelationshipCharacter = { id: 'romance-incapable', supportsAttraction: false };

function baseAssignment(overrides: Partial<AssignmentDefinition> = {}): AssignmentDefinition {
  return {
    id: 'a',
    category: 'recovery',
    title: 'A',
    description: '',
    requiredHousingTier: 'room',
    durationMinutes: 60,
    rewards: [],
    ...overrides,
  };
}

describe('validateAssignments', () => {
  it('validates the real assignment content against the real relationship roster', () => {
    expect(() => validateAssignments(ALL_ASSIGNMENTS, ALL_RELATIONSHIP_CHARACTERS)).not.toThrow();
  });

  it('rejects a duplicate id', () => {
    const assignment = baseAssignment();
    expect(() => validateAssignments([assignment, assignment])).toThrow('duplicate id');
  });

  it('rejects a non-positive duration', () => {
    const assignment = baseAssignment({ durationMinutes: 0 });
    expect(() => validateAssignments([assignment])).toThrow('positive duration');
  });

  it('rejects a relationship reward referencing an unknown character', () => {
    const assignment = baseAssignment({
      rewards: [{ kind: 'relationship-delta', characterId: 'missing', delta: { trust: 5 } }],
    });
    expect(() => validateAssignments([assignment])).toThrow('references missing relationship character "missing"');
  });

  it('rejects an attraction delta against a character that does not support it', () => {
    const assignment = baseAssignment({
      rewards: [{ kind: 'relationship-delta', characterId: 'romance-incapable', delta: { attraction: 5 } }],
    });
    expect(() => validateAssignments([assignment], [ROMANCE_INCAPABLE])).toThrow('does not support it');
  });
});
