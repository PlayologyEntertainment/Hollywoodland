import { validateAuditions } from '../content/PerformanceValidator';
import { ALL_ITEMS } from './InventoryDefinitions';
import type { AuditionDefinition } from './Performance';
import {
  ALL_RELATIONSHIP_CHARACTERS,
  CASTING_GATEKEEPER,
  LEADING_MAN,
  PRODUCTION_COORDINATOR,
  PUBLICITY_CHIEF,
  SCENE_PARTNER,
} from './RelationshipDefinitions';
import { ALL_TALENTS } from './TalentDefinitions';

/** Debug content for the Read the Room foundation round: the vertical
 * slice's climactic screen test (VERTICAL_SLICE_SPEC.md §3, critical-path
 * step 9). Preparation checks lean on content earlier rounds already
 * shipped — `SCENE_REHEARSAL_QUEST`'s `found-the-rhythm` stage,
 * `EXTRAS_CALL_QUEST`'s `cleared-for-call` stage, and the `audition-dress`
 * item from `SCREEN_TEST_QUEST`'s `attend` stage reward — rather than new
 * facts nothing sets yet, so a player who did that earlier content walks in
 * already partly prepared. Category options are debug placeholders: final
 * scene/dialogue text, exact fit values, and the featured attribute remain
 * Owner approval required, the same posture every other debug content
 * module in this codebase takes. */
export const SCREEN_TEST_AUDITION: AuditionDefinition = {
  id: 'screen-test',
  title: 'The Screen Test',
  featuredAttribute: 'craft',
  scenePartnerId: SCENE_PARTNER.id,
  preparationChecks: [
    {
      condition: { kind: 'item-owned', itemId: 'audition-dress' },
      label: 'You came dressed for the part.',
      points: 1,
    },
    {
      condition: { kind: 'fact', fact: 'quest:scene-rehearsal:stage:found-the-rhythm:complete' },
      label: 'You and your scene partner already found your rhythm.',
      points: 2,
    },
    {
      condition: { kind: 'fact', fact: 'quest:extras-call:stage:cleared-for-call:complete' },
      label: 'You already know your way around a soundstage.',
      points: 1,
    },
  ],
  categories: [
    {
      kind: 'intention',
      prompt: 'Why is this character in the room?',
      options: [
        { id: 'intention-prove-worth', label: 'To prove she belongs here.', fit: 2, attribute: 'craft' },
        { id: 'intention-charm-the-room', label: 'To win the room over.', fit: 0, attribute: 'presence' },
        { id: 'intention-earn-forgiveness', label: 'To earn someone’s forgiveness.', fit: 1, attribute: 'wit' },
      ],
    },
    {
      kind: 'technique',
      prompt: 'What do you lean on going in?',
      options: [
        { id: 'technique-method', label: 'The character work from Method Study.', fit: 1, talentId: 'drama-1' },
        { id: 'technique-observation', label: 'Reading the room before you commit.', fit: 1, talentId: 'observation-1' },
        { id: 'technique-instincts', label: 'Just your instincts.', fit: 0 },
      ],
    },
    {
      kind: 'delivery',
      prompt: 'How do you deliver the line?',
      options: [
        { id: 'delivery-restrained', label: 'Underplay it.', fit: 1, attribute: 'craft' },
        { id: 'delivery-conversational', label: 'Keep it conversational.', fit: 2, attribute: 'wit' },
        { id: 'delivery-big', label: 'Play it big for the back row.', fit: 0, attribute: 'presence' },
      ],
    },
    {
      kind: 'emotion',
      prompt: 'What do you let show?',
      options: [
        { id: 'emotion-vulnerable', label: 'Let the vulnerability through.', fit: 2, attribute: 'craft' },
        { id: 'emotion-defiant', label: 'Play it defiant.', fit: 1, attribute: 'nerve' },
        { id: 'emotion-playful', label: 'Keep it playful.', fit: 0, attribute: 'wit' },
      ],
    },
    {
      kind: 'blocking',
      prompt: 'How do you use the space?',
      options: [
        { id: 'blocking-trust-the-mark', label: 'Trust your mark.', fit: 1, talentId: 'stagecraft-1' },
        { id: 'blocking-claim-the-space', label: 'Claim more of the space than you were given.', fit: 0, attribute: 'grit' },
        { id: 'blocking-play-it-safe', label: 'Stay planted and play it safe.', fit: -1 },
      ],
    },
    {
      kind: 'improvisation',
      prompt: 'The scene leaves an opening. Do you take it?',
      options: [
        { id: 'improv-hold-the-line', label: 'Stick to the script.', fit: 0 },
        { id: 'improv-add-a-beat', label: 'Add an unscripted beat.', fit: 2, attribute: 'wit', talentId: 'comedy-1' },
        { id: 'improv-overreach', label: 'Improvise big and hope it lands.', fit: -1, attribute: 'nerve' },
      ],
    },
    {
      kind: 'adaptation',
      prompt: 'The reader changes the cue on you. What do you do?',
      options: [
        { id: 'adapt-lean-into-it', label: 'Lean into the change.', fit: 2, attribute: 'grit' },
        { id: 'adapt-recover-gracefully', label: 'Recover gracefully and keep going.', fit: 1, attribute: 'nerve', talentId: 'hustle-2' },
        { id: 'adapt-freeze', label: 'Freeze for a beat.', fit: -1 },
      ],
    },
  ],
  outcomeEffects: {
    breakthrough: [
      { kind: 'resource-delta', delta: { reputation: 15 } },
      { kind: 'xp-grant', amount: 60 },
      { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { trust: 10 } },
      { kind: 'set-fact', fact: 'screen-test:outcome:breakthrough' },
    ],
    'promising-complication': [
      { kind: 'resource-delta', delta: { reputation: 8 } },
      { kind: 'xp-grant', amount: 38 },
      { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { tension: 8 } },
      { kind: 'set-fact', fact: 'screen-test:outcome:promising-complication' },
    ],
    'wrong-role-right-notice': [
      { kind: 'resource-delta', delta: { reputation: 5 } },
      { kind: 'xp-grant', amount: 30 },
      { kind: 'relationship-delta', characterId: CASTING_GATEKEEPER.id, delta: { trust: 5 } },
      { kind: 'set-fact', fact: 'screen-test:outcome:wrong-role-right-notice' },
    ],
    'memorable-setback': [
      { kind: 'resource-delta', delta: { reputation: 1 } },
      { kind: 'xp-grant', amount: 15 },
      { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { trust: 5 } },
      { kind: 'set-fact', fact: 'screen-test:outcome:memorable-setback' },
    ],
  },
};

/** Chapter 2's first day on the soundstage (docs/DRAFT_CHAPTERS_2_10_CANON_PROPOSAL.md): the Lookout's one scene in *The
 * Corsair's Daughter*, played as a small Read the Room. A flubbed line, a stuck prop and a nervous director are the cues to
 * react to; the player can hold the script, improvise around the flub, or take the blame for the prop. Every result leaves the
 * `first-day:done` fact, so the quest's second stage can always be reached: a bad take writes the next scene rather than ending
 * the day. Preparation leans on the costume and the sides from the quests before it. */
export const LOOKOUT_FIRST_DAY_AUDITION: AuditionDefinition = {
  id: 'lookout-first-day',
  title: 'The Lookout, Take One',
  featuredAttribute: 'craft',
  scenePartnerId: SCENE_PARTNER.id,
  preparationChecks: [
    {
      condition: { kind: 'item-owned', itemId: 'lookout-costume' },
      label: 'You came to the set in your fitted costume.',
      points: 1,
    },
    {
      condition: { kind: 'item-owned', itemId: 'lookout-sides' },
      label: 'You learned your three lines on the way over.',
      points: 1,
    },
    {
      condition: { kind: 'fact', fact: 'lookout:costume:practical' },
      label: 'You and the wardrobe mistress thought about how the costume would move on camera.',
      points: 1,
    },
    {
      condition: { kind: 'fact', fact: 'lookout:fourth-line' },
      label: 'You have a fourth line to land, and you have been practicing it.',
      points: 1,
    },
  ],
  categories: [
    {
      kind: 'intention',
      prompt: 'Why does the Lookout warn the heroine?',
      options: [
        { id: 'intention-genuine-warning', label: 'Because she has spent a lifetime reading danger.', fit: 2, attribute: 'craft' },
        { id: 'intention-guilty-conscience', label: 'Because she is trying to make up for something.', fit: 1, attribute: 'wit' },
        { id: 'intention-steal-the-scene', label: 'Because it is your one chance to be noticed.', fit: 0, attribute: 'presence' },
      ],
    },
    {
      kind: 'delivery',
      prompt: 'How do you deliver your three lines?',
      options: [
        { id: 'delivery-low-and-quick', label: 'Low and quick, like someone who does not want to be heard.', fit: 2, attribute: 'craft' },
        { id: 'delivery-over-the-shoulder', label: 'Over your shoulder, on the move.', fit: 1, attribute: 'wit' },
        { id: 'delivery-to-the-back-row', label: 'Pitched to the back of the soundstage.', fit: 0, attribute: 'presence' },
      ],
    },
    {
      kind: 'blocking',
      prompt: 'The chalk marks put you at the edge of the crowd. What do you do with them?',
      options: [
        { id: 'blocking-trust-the-mark', label: 'Hit your mark and hold it.', fit: 1, talentId: 'stagecraft-1' },
        { id: 'blocking-drift-into-frame', label: 'Drift a half-step toward the lens.', fit: 0, attribute: 'presence' },
        { id: 'blocking-play-it-safe', label: 'Stay hidden behind the barrels.', fit: -1 },
      ],
    },
    {
      kind: 'improvisation',
      prompt: 'The leading man fumbles his cue and the stuck prop crate will not budge. Do you take the opening?',
      options: [
        { id: 'improv-hold-the-script', label: 'Stay in the script and let the director sort it.', fit: 0 },
        { id: 'improv-cover-the-flub', label: 'Improvise a line that covers for him.', fit: 2, attribute: 'wit', talentId: 'comedy-1' },
        { id: 'improv-overreach', label: 'Improvise big and hope it lands.', fit: -1, attribute: 'nerve' },
      ],
    },
    {
      kind: 'adaptation',
      prompt: 'The director shouts for a second take with the crate still jammed. What do you do?',
      options: [
        { id: 'adapt-take-the-blame', label: 'Take the blame for the crate and keep your place.', fit: 2, attribute: 'nerve', talentId: 'hustle-2' },
        { id: 'adapt-hold-the-scene', label: 'Quietly work the crate loose between takes.', fit: 1, attribute: 'grit', talentId: 'stagecraft-2' },
        { id: 'adapt-freeze', label: 'Freeze until someone tells you what to do.', fit: -1 },
      ],
    },
  ],
  outcomeEffects: {
    breakthrough: [
      { kind: 'resource-delta', delta: { reputation: 8 } },
      { kind: 'xp-grant', amount: 35 },
      { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { trust: 6 } },
      { kind: 'relationship-delta', characterId: LEADING_MAN.id, delta: { trust: 6 } },
      { kind: 'relationship-delta', characterId: PRODUCTION_COORDINATOR.id, delta: { trust: 5 } },
      { kind: 'relationship-delta', characterId: PUBLICITY_CHIEF.id, delta: { trust: 2 } },
      { kind: 'set-fact', fact: 'first-day:outcome:breakthrough' },
      { kind: 'set-fact', fact: 'first-day:done' },
    ],
    'promising-complication': [
      { kind: 'resource-delta', delta: { reputation: 5 } },
      { kind: 'xp-grant', amount: 25 },
      { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { trust: 3, tension: 3 } },
      { kind: 'relationship-delta', characterId: LEADING_MAN.id, delta: { trust: 4 } },
      { kind: 'relationship-delta', characterId: PRODUCTION_COORDINATOR.id, delta: { trust: 3 } },
      { kind: 'relationship-delta', characterId: PUBLICITY_CHIEF.id, delta: { trust: 2 } },
      { kind: 'set-fact', fact: 'first-day:outcome:promising-complication' },
      { kind: 'set-fact', fact: 'first-day:done' },
    ],
    'wrong-role-right-notice': [
      { kind: 'resource-delta', delta: { reputation: 3 } },
      { kind: 'xp-grant', amount: 15 },
      { kind: 'relationship-delta', characterId: LEADING_MAN.id, delta: { trust: 3 } },
      { kind: 'relationship-delta', characterId: PRODUCTION_COORDINATOR.id, delta: { trust: 2 } },
      { kind: 'relationship-delta', characterId: PUBLICITY_CHIEF.id, delta: { trust: 3 } },
      { kind: 'set-fact', fact: 'first-day:outcome:wrong-role-right-notice' },
      { kind: 'set-fact', fact: 'first-day:done' },
    ],
    'memorable-setback': [
      { kind: 'resource-delta', delta: { reputation: 1 } },
      { kind: 'xp-grant', amount: 10 },
      { kind: 'relationship-delta', characterId: LEADING_MAN.id, delta: { trust: 4 } },
      { kind: 'relationship-delta', characterId: PRODUCTION_COORDINATOR.id, delta: { trust: 4 } },
      { kind: 'set-fact', fact: 'first-day:outcome:memorable-setback' },
      { kind: 'set-fact', fact: 'first-day:done' },
    ],
  },
};

export const ALL_AUDITIONS: readonly AuditionDefinition[] = [SCREEN_TEST_AUDITION, LOOKOUT_FIRST_DAY_AUDITION];

validateAuditions(ALL_AUDITIONS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS, ALL_ITEMS);

export function getAuditionById(id: string): AuditionDefinition | undefined {
  return ALL_AUDITIONS.find((audition) => audition.id === id);
}
