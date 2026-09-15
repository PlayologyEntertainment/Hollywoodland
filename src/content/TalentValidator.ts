import type { TalentDefinition } from '../domain/Progression';
import { validateContent } from './ContentValidator';

/** Checks the authored talent set's structural integrity: unique ids, a
 * positive cost, a same-branch prerequisite reference (or none), and no
 * dependency cycle. Cross-branch prerequisites are rejected rather than
 * merely discouraged — each branch is meant to be a self-contained tree
 * (see Progression.ts), so a cross-branch reference is an authoring
 * mistake, not a design choice to leave room for. Cycle detection mirrors
 * `validateQuestGraph`'s DFS: `unlockTalent`'s prerequisite check would
 * simply never be satisfiable on a cycle rather than infinite-loop, but
 * catching it at content-load time is still cheaper than discovering a
 * permanently locked branch during a playtest. */
export function validateTalentTree(talents: readonly TalentDefinition[]): void {
  validateContent(talents, 'Talents');

  const byId = new Map(talents.map((talent) => [talent.id, talent]));
  for (const talent of talents) {
    if (talent.cost <= 0) {
      throw new Error(`Talent "${talent.id}" has a non-positive cost.`);
    }
    if (talent.prerequisiteId === null) continue;
    const prerequisite = byId.get(talent.prerequisiteId);
    if (prerequisite === undefined) {
      throw new Error(`Talent "${talent.id}" prerequisite references missing talent "${talent.prerequisiteId}".`);
    }
    if (prerequisite.branch !== talent.branch) {
      throw new Error(
        `Talent "${talent.id}" prerequisite "${talent.prerequisiteId}" belongs to a different branch.`,
      );
    }
  }

  const done = new Set<string>();
  const visiting = new Set<string>();
  function visit(talentId: string, path: readonly string[]): void {
    if (done.has(talentId)) return;
    if (visiting.has(talentId)) {
      throw new Error(`Talent tree has a dependency cycle: ${[...path, talentId].join(' -> ')}.`);
    }
    visiting.add(talentId);
    const prerequisiteId = byId.get(talentId)?.prerequisiteId;
    if (prerequisiteId !== null && prerequisiteId !== undefined) visit(prerequisiteId, [...path, talentId]);
    visiting.delete(talentId);
    done.add(talentId);
  }
  for (const talent of talents) visit(talent.id, []);
}
