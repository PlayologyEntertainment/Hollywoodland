import type { DialogueGraph } from '../domain/Dialogue';
import { validateContent } from './ContentValidator';

/** Checks a dialogue graph's structural integrity: unique node ids, unique
 * choice ids within each node, no dangling `next` references, and every
 * node reachable from the graph's root. Circular blocking dependencies (a
 * tech-plan validation concern for quest content) don't apply to a plain
 * dialogue tree, where a node can legitimately be revisited, so this
 * function doesn't check for cycles. */
export function validateDialogueGraph(graph: DialogueGraph): void {
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
