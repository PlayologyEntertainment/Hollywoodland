import type { AuditionDefinition } from '../domain/Performance';
import type { InventoryItemDefinition } from '../domain/Inventory';
import type { RelationshipCharacter } from '../domain/Relationships';
import type { TalentDefinition } from '../domain/Progression';
import { validateContent } from './ContentValidator';

/** Checks an authored audition set's structural integrity: unique audition
 * ids, unique category kinds and option ids within each audition, no
 * dangling scene-partner/talent/item reference, and no relationship-effect
 * reference an outcome can't actually apply — the same cross-checks
 * `validateQuestGraph` runs against quest content, since `AuditionDefinition`
 * shares its relationship/inventory/talent reference shapes with
 * `QuestDef`. */
export function validateAuditions(
  auditions: readonly AuditionDefinition[],
  roster: readonly RelationshipCharacter[] = [],
  talents: readonly TalentDefinition[] = [],
  items: readonly InventoryItemDefinition[] = [],
): void {
  validateContent(auditions, 'Auditions');

  for (const audition of auditions) {
    if (roster.find((character) => character.id === audition.scenePartnerId) === undefined) {
      throw new Error(`Audition "${audition.id}" references missing scene partner "${audition.scenePartnerId}".`);
    }

    validateContent(
      audition.categories.map((category) => ({ id: category.kind })),
      `Audition "${audition.id}" categories`,
    );

    for (const category of audition.categories) {
      validateContent(category.options, `Audition "${audition.id}" category "${category.kind}" options`);
      for (const option of category.options) {
        if (option.talentId !== undefined && talents.find((talent) => talent.id === option.talentId) === undefined) {
          throw new Error(
            `Audition "${audition.id}" option "${option.id}" references missing talent "${option.talentId}".`,
          );
        }
      }
    }

    for (const check of audition.preparationChecks) {
      const condition = check.condition;
      if (condition.kind !== 'item-owned') continue;
      if (items.find((item) => item.id === condition.itemId) === undefined) {
        throw new Error(`Audition "${audition.id}" preparation check references missing item "${condition.itemId}".`);
      }
    }

    for (const outcome of Object.keys(audition.outcomeEffects) as (keyof typeof audition.outcomeEffects)[]) {
      for (const effect of audition.outcomeEffects[outcome]) {
        if (effect.kind !== 'relationship-delta' && effect.kind !== 'relationship-pivotal-flag') continue;
        const character = roster.find((candidate) => candidate.id === effect.characterId);
        if (character === undefined) {
          throw new Error(
            `Audition "${audition.id}" outcome "${outcome}" effect references missing relationship character "${effect.characterId}".`,
          );
        }
        if (
          effect.kind === 'relationship-delta' &&
          effect.delta.attraction !== undefined &&
          !character.supportsAttraction
        ) {
          throw new Error(
            `Audition "${audition.id}" outcome "${outcome}" adjusts attraction for "${effect.characterId}", which does not support it.`,
          );
        }
      }
    }
  }
}
