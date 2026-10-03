import type { CareerState } from './CareerState';
import type { InventoryItemDefinition } from './Inventory';
import { getQuestStatus, questChapter, type QuestDef } from './Quests';
import type { RelationshipCharacter } from './Relationships';

/** Remembered once the player has seen the Chapter 1 Conclusion screen, so a finished career sees it a single time. It is a
 * plain fact, so it is saved and loaded with the rest of the career. */
export const CHAPTER_ONE_CONCLUDED_FACT = 'chapter:1:concluded';

/** Remembered once the player has seen the Chapter 2 title page. Chapter 2's quests wait on it, so they open only after the
 * page that introduces them. */
export const CHAPTER_TWO_STARTED_FACT = 'chapter:2:started';

/** Remembered once the player has seen the Chapter 2 Conclusion screen. */
export const CHAPTER_TWO_CONCLUDED_FACT = 'chapter:2:concluded';

/** A chapter is complete when every one of its quests is completed. (A quest that is still locked counts as not complete: the
 * chapter is not over until it has been unlocked and finished.) A chapter with no quests is never complete. */
export function isChapterComplete(
  chapter: number,
  state: CareerState,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[] = [],
): boolean {
  const inChapter = quests.filter((quest) => questChapter(quest) === chapter);
  return inChapter.length > 0 && inChapter.every((quest) => getQuestStatus(state, quest, quests, roster, items) === 'completed');
}

export function isChapterOneComplete(
  state: CareerState,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[] = [],
): boolean {
  return isChapterComplete(1, state, quests, roster, items);
}

export function isChapterTwoComplete(
  state: CareerState,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[] = [],
): boolean {
  return isChapterComplete(2, state, quests, roster, items);
}

export function hasConcludedChapterOne(state: CareerState): boolean {
  return state.facts[CHAPTER_ONE_CONCLUDED_FACT] === true;
}

export function hasStartedChapterTwo(state: CareerState): boolean {
  return state.facts[CHAPTER_TWO_STARTED_FACT] === true;
}

export function hasConcludedChapterTwo(state: CareerState): boolean {
  return state.facts[CHAPTER_TWO_CONCLUDED_FACT] === true;
}

/** A full-screen title card the game owes the player: a chapter's opening page, or the Conclusion that closes it. */
export interface ChapterCard {
  readonly kind: 'opening' | 'conclusion';
  readonly chapter: number;
}

/**
 * The Conclusion the career owes next, if any: a finished Chapter 1 gets its Conclusion, and a finished Chapter 2 gets its own.
 * Each is remembered as a fact once seen, so it plays once per career. Openings are not here: a chapter's opening page plays
 * only when the player asks for it (see `isChapterTwoPending`), never on its own. Pure, so the order is tested without a browser.
 */
export function nextChapterCard(
  state: CareerState,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[] = [],
): ChapterCard | undefined {
  if (!hasConcludedChapterOne(state)) {
    return isChapterOneComplete(state, quests, roster, items) ? { kind: 'conclusion', chapter: 1 } : undefined;
  }
  if (hasStartedChapterTwo(state)) {
    return !hasConcludedChapterTwo(state) && isChapterTwoComplete(state, quests, roster, items) ? { kind: 'conclusion', chapter: 2 } : undefined;
  }
  return undefined;
}

/** Chapter 1 is concluded but the player has not yet started Chapter 2: the Quest Helper offers a Start button, and Chapter 2's
 * quests and conversations stay hidden until its opening page has played. Remembered by the facts, so it survives save and load. */
export function isChapterTwoPending(state: CareerState): boolean {
  return hasConcludedChapterOne(state) && !hasStartedChapterTwo(state);
}

/** The fact a card leaves behind once the player has read it and left. */
export function chapterCardFact(card: ChapterCard): string | undefined {
  if (card.kind === 'opening') return card.chapter === 2 ? CHAPTER_TWO_STARTED_FACT : undefined;
  if (card.chapter === 1) return CHAPTER_ONE_CONCLUDED_FACT;
  return card.chapter === 2 ? CHAPTER_TWO_CONCLUDED_FACT : undefined;
}

/** The first chapter with nothing built yet, for the "coming soon" objective: the one after the latest concluded chapter. */
export function comingSoonChapter(state: CareerState): number {
  if (hasConcludedChapterTwo(state)) return 3;
  return 2;
}
