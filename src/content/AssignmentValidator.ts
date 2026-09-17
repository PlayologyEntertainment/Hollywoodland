import type { AssignmentDefinition } from '../domain/Assignments';
import type { RelationshipCharacter } from '../domain/Relationships';
import { validateContent } from './ContentValidator';

/** Checks an assignment set's structural integrity: unique ids, a positive
 * duration, and (when `roster` is provided) no relationship reward
 * referencing an unknown character or adjusting attraction for a character
 * that doesn't support it — the same cross-check `validateQuestGraph` runs
 * for a quest's relationship prerequisites and rewards. */
export function validateAssignments(
  assignments: readonly AssignmentDefinition[],
  roster: readonly RelationshipCharacter[] = [],
): void {
  validateContent(assignments, 'Assignments');
  for (const assignment of assignments) {
    if (assignment.durationMinutes <= 0) {
      throw new Error(`Assignment "${assignment.id}" must have a positive duration.`);
    }
    for (const reward of assignment.rewards) {
      if (reward.kind !== 'relationship-delta' && reward.kind !== 'relationship-pivotal-flag') continue;
      const character = roster.find((candidate) => candidate.id === reward.characterId);
      if (character === undefined) {
        throw new Error(
          `Assignment "${assignment.id}" reward references missing relationship character "${reward.characterId}".`,
        );
      }
      if (reward.kind === 'relationship-delta' && reward.delta.attraction !== undefined && !character.supportsAttraction) {
        throw new Error(
          `Assignment "${assignment.id}" reward adjusts attraction for "${reward.characterId}", which does not support it.`,
        );
      }
    }
  }
}
