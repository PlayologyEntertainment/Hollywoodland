import { validateAssignments } from '../content/AssignmentValidator';
import type { AssignmentDefinition } from './Assignments';
import { ALL_RELATIONSHIP_CHARACTERS, SCENE_PARTNER } from './RelationshipDefinitions';

/** Debug content for the idle/offline assignments round: one assignment per
 * GDD category, available from the starting boarding-house room, plus one
 * apartment-gated class proving the housing-tier unlock actually narrows the
 * list — final titles/copy remain Owner approval required, the same posture
 * every other debug content module in this codebase takes. */
export const SCENE_STUDY_CLASS: AssignmentDefinition = {
  id: 'scene-study-class',
  category: 'class',
  title: 'Scene Study Class',
  description: 'A church-basement acting class, three nights a week.',
  requiredHousingTier: 'room',
  durationMinutes: 60,
  rewards: [{ kind: 'xp-grant', amount: 15 }],
};

export const DINER_COUNTER_SHIFT: AssignmentDefinition = {
  id: 'diner-counter-shift',
  category: 'side-job',
  title: 'Diner Counter Shift',
  description: 'Pour coffee and bus tables for a few hours of grocery money.',
  requiredHousingTier: 'room',
  durationMinutes: 15,
  rewards: [{ kind: 'resource-delta', delta: { money: 25 } }],
};

export const RUN_LINES_WITH_SCENE_PARTNER: AssignmentDefinition = {
  id: 'run-lines-with-scene-partner',
  category: 'networking',
  title: 'Run Lines Together',
  description: `Spend the evening running lines with ${SCENE_PARTNER.role.toLowerCase()}.`,
  requiredHousingTier: 'room',
  durationMinutes: 5,
  rewards: [{ kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { trust: 5 } }],
};

export const EARLY_NIGHT_IN: AssignmentDefinition = {
  id: 'early-night-in',
  category: 'recovery',
  title: 'Early Night In',
  description: 'Skip the noise, sleep it off, and start tomorrow rested.',
  requiredHousingTier: 'room',
  durationMinutes: 120,
  rewards: [{ kind: 'resource-delta', delta: { energy: 40 } }],
};

export const ADVANCED_SCENE_WORKSHOP: AssignmentDefinition = {
  id: 'advanced-scene-workshop',
  category: 'class',
  title: 'Advanced Scene Workshop',
  description: 'A full-day intensive, worth having your own walls for.',
  requiredHousingTier: 'apartment',
  durationMinutes: 240,
  rewards: [{ kind: 'xp-grant', amount: 40 }],
};

export const ALL_ASSIGNMENTS: readonly AssignmentDefinition[] = [
  SCENE_STUDY_CLASS,
  DINER_COUNTER_SHIFT,
  RUN_LINES_WITH_SCENE_PARTNER,
  EARLY_NIGHT_IN,
  ADVANCED_SCENE_WORKSHOP,
];

validateAssignments(ALL_ASSIGNMENTS, ALL_RELATIONSHIP_CHARACTERS);
