import { validateAssignments } from '../content/AssignmentValidator';
import type { AssignmentDefinition } from './Assignments';
import { ALL_RELATIONSHIP_CHARACTERS, SCENE_PARTNER } from './RelationshipDefinitions';

/** Debug content for the idle/offline assignments round: one assignment per
 * GDD category, available from the starting boarding-house room, one
 * apartment-gated class proving the housing-tier unlock actually narrows the
 * list, and four more that unlock one per level from level 2 to 5 — final titles/copy remain Owner approval required, the same posture
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
  rewards: [{ kind: 'resource-delta', delta: { money: 25 } }, { kind: 'xp-grant', amount: 5 }],
};

export const RUN_LINES_WITH_SCENE_PARTNER: AssignmentDefinition = {
  id: 'run-lines-with-scene-partner',
  category: 'networking',
  title: 'Run Lines Together',
  description: `Spend the evening running lines with ${SCENE_PARTNER.role.toLowerCase()}.`,
  requiredHousingTier: 'room',
  durationMinutes: 5,
  rewards: [
    { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { trust: 5 } },
    { kind: 'xp-grant', amount: 2 },
  ],
};

export const EARLY_NIGHT_IN: AssignmentDefinition = {
  id: 'early-night-in',
  category: 'recovery',
  title: 'Early Night In',
  description: 'Skip the noise, sleep it off, and pick up a little cash on the way out.',
  requiredHousingTier: 'room',
  durationMinutes: 120,
  rewards: [{ kind: 'resource-delta', delta: { money: 50 } }, { kind: 'xp-grant', amount: 25 }],
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

export const EXTRA_ON_A_BACKLOT: AssignmentDefinition = {
  id: 'extra-on-a-backlot',
  category: 'side-job',
  title: 'Extra on a Backlot',
  description: 'Stand in the background of a crowd scene, hoping the camera lingers on you.',
  requiredHousingTier: 'room',
  requiredLevel: 2,
  durationMinutes: 90,
  rewards: [{ kind: 'resource-delta', delta: { money: 60 } }, { kind: 'xp-grant', amount: 12 }],
};

export const COLD_READING_CLINIC: AssignmentDefinition = {
  id: 'cold-reading-clinic',
  category: 'class',
  title: 'Cold Reading Clinic',
  description: "A casting director's weekend workshop: a script you've never seen, three minutes to make it sing.",
  requiredHousingTier: 'room',
  requiredLevel: 3,
  durationMinutes: 150,
  rewards: [{ kind: 'xp-grant', amount: 35 }],
};

export const PREMIERE_AFTER_PARTY: AssignmentDefinition = {
  id: 'premiere-after-party',
  category: 'networking',
  title: 'Premiere After-Party',
  description: 'Work the room at a studio mixer with a borrowed jacket and a practiced smile.',
  requiredHousingTier: 'room',
  requiredLevel: 4,
  durationMinutes: 45,
  rewards: [
    { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { trust: 8 } },
    { kind: 'xp-grant', amount: 10 },
  ],
};

export const DAY_TRIP_TO_THE_COAST: AssignmentDefinition = {
  id: 'day-trip-to-the-coast',
  category: 'recovery',
  title: 'Day Trip to the Coast',
  description: 'Drive out to the ocean, let the town go quiet in your head, and come back sharper.',
  requiredHousingTier: 'room',
  requiredLevel: 5,
  durationMinutes: 180,
  rewards: [{ kind: 'resource-delta', delta: { money: 75 } }, { kind: 'xp-grant', amount: 45 }],
};

export const ALL_ASSIGNMENTS: readonly AssignmentDefinition[] = [
  SCENE_STUDY_CLASS,
  DINER_COUNTER_SHIFT,
  RUN_LINES_WITH_SCENE_PARTNER,
  EARLY_NIGHT_IN,
  ADVANCED_SCENE_WORKSHOP,
  EXTRA_ON_A_BACKLOT,
  COLD_READING_CLINIC,
  PREMIERE_AFTER_PARTY,
  DAY_TRIP_TO_THE_COAST,
];

validateAssignments(ALL_ASSIGNMENTS, ALL_RELATIONSHIP_CHARACTERS);
