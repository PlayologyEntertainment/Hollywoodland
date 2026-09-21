import type { CareerState } from '../domain/CareerState';
import type { InventoryItemDefinition } from '../domain/Inventory';
import { getActiveStage, getQuestStatus, type QuestDef } from '../domain/Quests';
import type { RelationshipCharacter } from '../domain/Relationships';

/** One row of the Status panel's quest log. */
export interface QuestLogEntry {
  readonly id: string;
  readonly title: string;
  /** What the row says after the title: the current stage, "Available", or "Completed". */
  readonly label: string;
  readonly completed: boolean;
}

/**
 * The quests to show, in the order to show them: every quest the player can see (locked ones stay hidden), open quests first
 * in the game's own quest order, then completed quests below them, also in quest order. Pure, so the ordering and wording are
 * tested without a browser.
 */
export function buildQuestLog(
  state: CareerState,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[] = [],
): QuestLogEntry[] {
  const entries: QuestLogEntry[] = [];
  for (const quest of quests) {
    const status = getQuestStatus(state, quest, quests, roster, items);
    if (status === 'locked') continue;
    const stage = status === 'active' ? getActiveStage(state, quest) : undefined;
    entries.push({
      id: quest.id,
      title: quest.title,
      label: status === 'completed' ? 'Completed' : (stage?.description ?? 'Available'),
      completed: status === 'completed',
    });
  }
  // A stable partition: Array.prototype.sort is stable, so each group keeps the quests' own order.
  return entries.sort((a, b) => Number(a.completed) - Number(b.completed));
}
