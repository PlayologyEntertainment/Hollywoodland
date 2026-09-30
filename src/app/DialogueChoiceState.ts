import { evaluateCondition, isChoiceAvailable, type DialogueChoice, type DialogueCondition } from '../domain/Dialogue';
import type { CareerState } from '../domain/CareerState';
import type { InventoryItemDefinition } from '../domain/Inventory';
import { getQuestStatus, type QuestDef } from '../domain/Quests';
import type { RelationshipCharacter } from '../domain/Relationships';

/** How one dialogue choice should look and sound right now. */
export interface DialogueChoiceState {
  /** Can be clicked. */
  readonly available: boolean;
  /** Not clickable because a story prerequisite is unmet, so its wording could give the story away and it is blurred.
   * Not set when the only obstacle is energy, or when the choice is one the player has already taken. */
  readonly locked: boolean;
  /** Costs energy. Such choices carry the story, so they are outlined and play the ChoiceExp sound. */
  readonly usesEnergy: boolean;
}

/** A choice spends energy when any of its effects lowers it. */
export function choiceUsesEnergy(choice: DialogueChoice): boolean {
  return (choice.effects ?? []).some((effect) => effect.kind === 'resource-delta' && (effect.delta.energy ?? 0) < 0);
}

export function describeDialogueChoice(
  state: CareerState,
  choice: DialogueChoice,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[],
): DialogueChoiceState {
  const available = isChoiceAvailable(state, choice, quests, roster, items);
  const locked =
    !available &&
    (choice.conditions ?? []).some(
      (condition) =>
        !isEnergyCondition(condition) &&
        !evaluateCondition(state, condition, quests, roster, items) &&
        !isAlreadyDone(state, condition, quests, roster, items),
    );
  return { available, locked, usesEnergy: choiceUsesEnergy(choice) };
}

function isEnergyCondition(condition: DialogueCondition): boolean {
  return condition.kind === 'resource-at-least' && condition.resource === 'energy';
}

/** A failed condition that only means "you have already done this": a one-time fact that is now set, or a quest the choice
 * needed active that is now finished. The player has seen that wording, so there is nothing left to hide. */
function isAlreadyDone(
  state: CareerState,
  condition: DialogueCondition,
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[],
): boolean {
  if (condition.kind === 'fact') return condition.equals === false && state.facts[condition.fact] === true;
  if (condition.kind === 'quest-status' && condition.status === 'active') {
    const quest = quests.find((candidate) => candidate.id === condition.questId);
    return quest !== undefined && getQuestStatus(state, quest, quests, roster, items) === 'completed';
  }
  return false;
}
