import type { CareerState } from './CareerState';
import type { InventoryItemDefinition } from './Inventory';
import { getQuestStatus, type QuestDef } from './Quests';
import type { RelationshipCharacter } from './Relationships';

/** Remembered once the player has seen the Chapter 1 Conclusion screen, so a finished career sees it a single time. It is a
 * plain fact, so it is saved and loaded with the rest of the career. */
export const CHAPTER_ONE_CONCLUDED_FACT = 'chapter:1:concluded';

/** Every quest there is today belongs to Chapter 1, so the chapter is complete when they are all completed. (A quest that is
 * still locked counts as not complete: the chapter is not over until it has been unlocked and finished.) Give quests a chapter
 * when Chapter 2 brings its own. */
export function isChapterOneComplete(
  state: CareerState,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[] = [],
): boolean {
  return quests.length > 0 && quests.every((quest) => getQuestStatus(state, quest, quests, roster, items) === 'completed');
}

export function hasConcludedChapterOne(state: CareerState): boolean {
  return state.facts[CHAPTER_ONE_CONCLUDED_FACT] === true;
}
