import type { RelationshipCharacterDef } from '../domain/RelationshipDefinitions';
import { validateContent } from './ContentValidator';

/** Checks the authored relationship roster's structural integrity: unique
 * character ids and a non-empty role label. Numeric bounds live entirely in
 * `applyRelationshipAxesDelta`'s clamping (see Relationships.ts) since this
 * content has no starting-value overrides that could be authored out of
 * range. */
export function validateRelationshipRoster(roster: readonly RelationshipCharacterDef[]): void {
  validateContent(roster, 'Relationship roster');
  for (const character of roster) {
    if (character.role.trim().length === 0) {
      throw new Error(`Relationship character "${character.id}" has an empty role.`);
    }
  }
}
