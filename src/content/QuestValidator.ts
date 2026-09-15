import type { QuestDef } from '../domain/Quests';
import { validateContent } from './ContentValidator';

/** Checks a quest set's structural integrity: unique quest ids, unique
 * stage ids within each quest, no quest with zero stages, no dangling
 * quest-status prerequisite reference, and no dependency cycle. Unlike
 * dialogue trees (where revisiting a node is legitimate and BFS
 * reachability is enough), quest prerequisites form a real dependency
 * graph that must be acyclic — `getQuestStatus`'s recursive resolution of
 * quest-status prerequisites would infinite-loop on a cycle, so this is
 * validated once at content-load time rather than guarded at runtime. */
export function validateQuestGraph(quests: readonly QuestDef[]): void {
  validateContent(quests, 'Quests');
  for (const quest of quests) {
    validateContent(quest.stages, `Quest "${quest.id}" stages`);
    if (quest.stages.length === 0) {
      throw new Error(`Quest "${quest.id}" has no stages.`);
    }
  }

  const questIds = new Set(quests.map((quest) => quest.id));
  const dependsOn = new Map<string, Set<string>>();
  for (const quest of quests) {
    const edges = new Set<string>();
    for (const condition of quest.prerequisites ?? []) {
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
