import { validateTalentTree } from '../content/TalentValidator';
import type { TalentDefinition } from './Progression';

/** Debug content for the Phase 2 progression-foundation round: a two-tier
 * talent tree under each of the Vertical Slice Spec's (§3) seven initial
 * branches — Drama, Comedy, Dance, Charm, Hustle, Observation, Stagecraft —
 * plus one authored fork (Drama's tier 2 splits into two alternatives) to
 * exercise real branching rather than a straight line. Final names,
 * descriptions, costs, and the branch-to-attribute mapping remain Owner
 * approval required, the same posture Origins.ts and
 * RelationshipDefinitions.ts already take toward their own debug content. */
export const ALL_TALENTS: readonly TalentDefinition[] = [
  {
    id: 'drama-1',
    branch: 'drama',
    name: 'Method Study',
    description: 'Dig into a character before the cameras roll.',
    attribute: 'craft',
    attributeBonus: 1,
    cost: 1,
    prerequisiteId: null,
  },
  {
    id: 'drama-2-stage-presence',
    branch: 'drama',
    name: 'Stage Presence',
    description: 'Fill a room without raising your voice.',
    attribute: 'craft',
    attributeBonus: 1,
    cost: 2,
    prerequisiteId: 'drama-1',
  },
  {
    id: 'drama-2-screen-restraint',
    branch: 'drama',
    name: 'Screen Restraint',
    description: 'Let the camera do the work a stage never could.',
    attribute: 'craft',
    attributeBonus: 1,
    cost: 2,
    prerequisiteId: 'drama-1',
  },
  {
    id: 'comedy-1',
    branch: 'comedy',
    name: 'Quick Wit',
    description: 'Land a line before the room knows it is coming.',
    attribute: 'wit',
    attributeBonus: 1,
    cost: 1,
    prerequisiteId: null,
  },
  {
    id: 'comedy-2',
    branch: 'comedy',
    name: 'Timing',
    description: 'Hold the pause exactly as long as it needs.',
    attribute: 'wit',
    attributeBonus: 1,
    cost: 2,
    prerequisiteId: 'comedy-1',
  },
  {
    id: 'dance-1',
    branch: 'dance',
    name: 'Footwork Basics',
    description: 'Hit your marks without looking at your feet.',
    attribute: 'grit',
    attributeBonus: 1,
    cost: 1,
    prerequisiteId: null,
  },
  {
    id: 'dance-2',
    branch: 'dance',
    name: 'Stamina Routines',
    description: 'Sixteen takes in, still hitting the count.',
    attribute: 'grit',
    attributeBonus: 1,
    cost: 2,
    prerequisiteId: 'dance-1',
  },
  {
    id: 'charm-1',
    branch: 'charm',
    name: 'Easy Smile',
    description: 'Put a stranger at ease in one line.',
    attribute: 'presence',
    attributeBonus: 1,
    cost: 1,
    prerequisiteId: null,
  },
  {
    id: 'charm-2',
    branch: 'charm',
    name: 'Room Command',
    description: 'Every eye finds you first, without trying.',
    attribute: 'presence',
    attributeBonus: 1,
    cost: 2,
    prerequisiteId: 'charm-1',
  },
  {
    id: 'hustle-1',
    branch: 'hustle',
    name: 'Door-Knocking',
    description: 'One more casting office before the day is done.',
    attribute: 'nerve',
    attributeBonus: 1,
    cost: 1,
    prerequisiteId: null,
  },
  {
    id: 'hustle-2',
    branch: 'hustle',
    name: 'Nerve of Steel',
    description: 'Walk into a closed set like you were invited.',
    attribute: 'nerve',
    attributeBonus: 1,
    cost: 2,
    prerequisiteId: 'hustle-1',
  },
  {
    id: 'observation-1',
    branch: 'observation',
    name: 'Reading the Room',
    description: 'Notice who actually holds the power at the table.',
    attribute: 'wit',
    attributeBonus: 1,
    cost: 1,
    prerequisiteId: null,
  },
  {
    id: 'observation-2',
    branch: 'observation',
    name: 'Script Sense',
    description: 'Spot the note behind the note.',
    attribute: 'wit',
    attributeBonus: 1,
    cost: 2,
    prerequisiteId: 'observation-1',
  },
  {
    id: 'stagecraft-1',
    branch: 'stagecraft',
    name: 'Blocking Basics',
    description: 'Move through a set without ever being in the way.',
    attribute: 'craft',
    attributeBonus: 1,
    cost: 1,
    prerequisiteId: null,
  },
  {
    id: 'stagecraft-2',
    branch: 'stagecraft',
    name: 'Marks and Light',
    description: 'Find your key light without a mark chalked down.',
    attribute: 'craft',
    attributeBonus: 1,
    cost: 2,
    prerequisiteId: 'stagecraft-1',
  },
];

validateTalentTree(ALL_TALENTS);

export function getTalentById(id: string): TalentDefinition | undefined {
  return ALL_TALENTS.find((talent) => talent.id === id);
}
