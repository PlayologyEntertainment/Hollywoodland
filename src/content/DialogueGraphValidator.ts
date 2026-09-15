import type { DialogueChoice, DialogueGraph } from '../domain/Dialogue';
import type { QuestDef } from '../domain/Quests';
import type { RelationshipCharacter } from '../domain/Relationships';
import { validateContent } from './ContentValidator';

/** Checks a dialogue graph's structural integrity: unique node ids, unique
 * choice ids within each node, no dangling `next` references, and every
 * node reachable from the graph's root. Circular blocking dependencies (a
 * tech-plan validation concern for quest content) don't apply to a plain
 * dialogue tree, where a node can legitimately be revisited, so this
 * function doesn't check for cycles.
 *
 * `quests` and `roster`, when provided, additionally cross-check any
 * quest/relationship condition or effect in the graph against real
 * quest/stage/character ids (and, for relationships, that an `attraction`
 * reference targets a romance-capable character) — omitting either only
 * weakens validation (existing fixtures without that wiring are
 * unaffected), it never changes runtime behavior. */
export function validateDialogueGraph(
  graph: DialogueGraph,
  quests: readonly QuestDef[] = [],
  roster: readonly RelationshipCharacter[] = [],
): void {
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
      validateRelationshipReferences(graph, node.id, choice, roster);
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

function findRelationshipCharacter(
  graph: DialogueGraph,
  nodeId: string,
  choice: DialogueChoice,
  roster: readonly RelationshipCharacter[],
  characterId: string,
): RelationshipCharacter {
  const character = roster.find((candidate) => candidate.id === characterId);
  if (character === undefined) {
    throw new Error(
      `Dialogue graph "${graph.id}" node "${nodeId}" choice "${choice.id}" references missing relationship character "${characterId}".`,
    );
  }
  return character;
}

function validateRelationshipReferences(
  graph: DialogueGraph,
  nodeId: string,
  choice: DialogueChoice,
  roster: readonly RelationshipCharacter[],
): void {
  for (const condition of choice.conditions ?? []) {
    if (condition.kind !== 'relationship-at-least' && condition.kind !== 'relationship-label') continue;
    const character = findRelationshipCharacter(graph, nodeId, choice, roster, condition.characterId);
    if (condition.kind === 'relationship-at-least' && condition.axis === 'attraction' && !character.supportsAttraction) {
      throw new Error(
        `Dialogue graph "${graph.id}" node "${nodeId}" choice "${choice.id}" checks attraction against "${condition.characterId}", which does not support it.`,
      );
    }
  }
  for (const effect of choice.effects ?? []) {
    if (effect.kind !== 'relationship-delta' && effect.kind !== 'relationship-pivotal-flag') continue;
    const character = findRelationshipCharacter(graph, nodeId, choice, roster, effect.characterId);
    if (effect.kind === 'relationship-delta' && effect.delta.attraction !== undefined && !character.supportsAttraction) {
      throw new Error(
        `Dialogue graph "${graph.id}" node "${nodeId}" choice "${choice.id}" adjusts attraction on "${effect.characterId}", which does not support it.`,
      );
    }
  }
}
