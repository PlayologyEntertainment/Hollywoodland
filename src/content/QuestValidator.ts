import type { InventoryItemDefinition } from '../domain/Inventory';
import type { TalentDefinition } from '../domain/Progression';
import type { QuestDef } from '../domain/Quests';
import type { RelationshipCharacter, RelationshipCondition } from '../domain/Relationships';
import { validateContent } from './ContentValidator';

/** Checks a quest set's structural integrity: unique quest ids, unique
 * stage ids within each quest, no quest with zero stages, no dangling
 * quest-status prerequisite reference, no dependency cycle, and (when
 * `roster`/`talents`/`items` are provided) no dangling relationship/talent/
 * item prerequisite or stage-reward reference, or an `attraction` check
 * against a character that doesn't support it — the same cross-checks
 * `validateDialogueGraph` runs, since a quest prerequisite and a dialogue
 * choice condition share the same `RelationshipCondition`/
 * `ProgressionCondition`/`InventoryCondition` shapes. Unlike dialogue trees
 * (where revisiting a node is legitimate and BFS reachability is enough),
 * quest prerequisites form a real dependency graph that must be acyclic —
 * `getQuestStatus`'s recursive resolution of quest-status prerequisites
 * would infinite-loop on a cycle, so this is validated once at
 * content-load time rather than guarded at runtime. */
export function validateQuestGraph(
  quests: readonly QuestDef[],
  roster: readonly RelationshipCharacter[] = [],
  talents: readonly TalentDefinition[] = [],
  items: readonly InventoryItemDefinition[] = [],
): void {
  validateContent(quests, 'Quests');
  for (const quest of quests) {
    validateContent(quest.stages, `Quest "${quest.id}" stages`);
    if (quest.stages.length === 0) {
      throw new Error(`Quest "${quest.id}" has no stages.`);
    }
    for (const stage of quest.stages) {
      for (const reward of stage.rewards ?? []) {
        if (reward.kind !== 'item-grant') continue;
        if (items.find((item) => item.id === reward.itemId) === undefined) {
          throw new Error(
            `Quest "${quest.id}" stage "${stage.id}" reward references missing item "${reward.itemId}".`,
          );
        }
      }
    }
  }

  const questIds = new Set(quests.map((quest) => quest.id));
  const dependsOn = new Map<string, Set<string>>();
  for (const quest of quests) {
    const edges = new Set<string>();
    for (const condition of quest.prerequisites ?? []) {
      if (condition.kind === 'relationship-at-least' || condition.kind === 'relationship-label') {
        validateRelationshipReference(quest, condition, roster);
        continue;
      }
      if (condition.kind === 'talent-unlocked') {
        if (talents.find((talent) => talent.id === condition.talentId) === undefined) {
          throw new Error(`Quest "${quest.id}" prerequisite references missing talent "${condition.talentId}".`);
        }
        continue;
      }
      if (condition.kind === 'item-owned') {
        if (items.find((item) => item.id === condition.itemId) === undefined) {
          throw new Error(`Quest "${quest.id}" prerequisite references missing item "${condition.itemId}".`);
        }
        continue;
      }
      if (condition.kind !== 'quest-status') continue;
      if (!questIds.has(condition.questId)) {
        throw new Error(`Quest "${quest.id}" prerequisite references missing quest "${condition.questId}".`);
      }
      edges.add(condition.questId);
    }
    dependsOn.set(quest.id, edges);
  }

  const done = new Set<string>();
  const visiting = new Set<string>();
  function visit(questId: string, path: readonly string[]): void {
    if (done.has(questId)) return;
    if (visiting.has(questId)) {
      throw new Error(`Quest graph has a dependency cycle: ${[...path, questId].join(' -> ')}.`);
    }
    visiting.add(questId);
    for (const dependency of dependsOn.get(questId) ?? []) visit(dependency, [...path, questId]);
    visiting.delete(questId);
    done.add(questId);
  }
  for (const quest of quests) visit(quest.id, []);
}

function validateRelationshipReference(
  quest: QuestDef,
  condition: RelationshipCondition,
  roster: readonly RelationshipCharacter[],
): void {
  const character = roster.find((candidate) => candidate.id === condition.characterId);
  if (character === undefined) {
    throw new Error(`Quest "${quest.id}" prerequisite references missing relationship character "${condition.characterId}".`);
  }
  if (condition.kind === 'relationship-at-least' && condition.axis === 'attraction' && !character.supportsAttraction) {
    throw new Error(
      `Quest "${quest.id}" prerequisite checks attraction against "${condition.characterId}", which does not support it.`,
    );
  }
}
