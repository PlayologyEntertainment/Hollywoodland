import { describe, expect, it } from 'vitest';

import { validateRelationshipRoster } from '../src/content/RelationshipValidator';
import { ALL_RELATIONSHIP_CHARACTERS } from '../src/domain/RelationshipDefinitions';
import type { RelationshipCharacterDef } from '../src/domain/RelationshipDefinitions';

describe('validateRelationshipRoster', () => {
  it('accepts a valid roster', () => {
    const roster: RelationshipCharacterDef[] = [{ id: 'a', role: 'Confidant', supportsAttraction: true }];
    expect(() => validateRelationshipRoster(roster)).not.toThrow();
  });

  it('rejects a duplicate character id', () => {
    const character: RelationshipCharacterDef = { id: 'dup', role: 'X', supportsAttraction: false };
    expect(() => validateRelationshipRoster([character, character])).toThrow('duplicate id');
  });

  it('rejects a blank role', () => {
    const character: RelationshipCharacterDef = { id: 'a', role: '   ', supportsAttraction: false };
    expect(() => validateRelationshipRoster([character])).toThrow('empty role');
  });

  it('validates the real relationship roster', () => {
    expect(() => validateRelationshipRoster(ALL_RELATIONSHIP_CHARACTERS)).not.toThrow();
  });
});
