import type { DialogueChoice, DialogueGraph } from '../domain/Dialogue';
import type { QuestDef } from '../domain/Quests';
import { validateContent } from './ContentValidator';

/** Checks a dialogue graph's structural integrity: unique node ids, unique
 * choice ids within each node, no dangling `next` references, and every
 * node reachable from the graph's root. Circular blocking dependencies (a
 * tech-plan validation concern for quest content) don't apply to a plain
 * dialogue tree, where a node can legitimately be revisited, so this
 * function doesn't check for cycles.
 *
 * `quests`, when provided, additionally cross-checks any quest-action
 * effect or quest-status condition in the graph against real quest/stage
 * ids — omitting it only weakens validation (existing fixtures without
 * quest wiring are unaffected), it never changes runtime behavior. */
export function validateDialogueGraph(graph: DialogueGraph, quests: readonly QuestDef[] = []): void {
  validateContent(graph.nodes, `Dialogue graph "${graph.id}" nodes`);
  for (const node of graph.nodes) {
    validateContent(node.choices, `Dialogue graph "${graph.id}" node "${node.id}" choices`);
  }

  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  if (!nodeIds.has(graph.rootNodeId)) {
    throw new Error(`Dialogue graph "${graph.id}" root node "${graph.rootNodeId}" does not exist.`);
  }
  for (const node of graph.nodes) {
    for (const choice of node.choices) {
      if (choice.next !== null && !nodeIds.has(choice.next)) {
        throw new Error(
          `Dialogue graph "${graph.id}" node "${node.id}" choice "${choice.id}" references missing node "${choice.next}".`,
        );
      }
      validateQuestReferences(graph, node.id, choice, quests);
    }
  }

  const reachable = new Set<string>([graph.rootNodeId]);
  const queue = [graph.rootNodeId];
  while (queue.length > 0) {
    const currentId = queue.shift();
    const current = graph.nodes.find((node) => node.id === currentId);
    if (current === undefined) continue;
    for (const choice of current.choices) {
      if (choice.next !== null && !reachable.has(choice.next)) {
        reachable.add(choice.next);
        queue.push(choice.next);
      }
    }
  }
  for (const node of graph.nodes) {
    if (!reachable.has(node.id)) {
      throw new Error(`Dialogue graph "${graph.id}" node "${node.id}" is unreachable from root "${graph.rootNodeId}".`);
    }
  }
}

function validateQuestReferences(
  graph: DialogueGraph,
  nodeId: string,
  choice: DialogueChoice,
  quests: readonly QuestDef[],
): void {
  for (const condition of choice.conditions ?? []) {
    if (condition.kind !== 'quest-status') continue;
    if (quests.find((quest) => quest.id === condition.questId) === undefined) {
      throw new Error(
        `Dialogue graph "${graph.id}" node "${nodeId}" choice "${choice.id}" references missing quest "${condition.questId}".`,
      );
    }
  }
  for (const effect of choice.effects ?? []) {
    if (effect.kind !== 'quest-action') continue;
    const quest = quests.find((candidate) => candidate.id === effect.questId);
    if (quest === undefined) {
      throw new Error(
        `Dialogue graph "${graph.id}" node "${nodeId}" choice "${choice.id}" references missing quest "${effect.questId}".`,
      );
    }
    if (effect.action === 'complete-stage' && quest.stages.find((stage) => stage.id === effect.stageId) === undefined) {
      throw new Error(
        `Dialogue graph "${graph.id}" node "${nodeId}" choice "${choice.id}" references missing stage "${String(effect.stageId)}" on quest "${effect.questId}".`,
      );
    }
  }
}
