import { validateAuditions } from '../content/PerformanceValidator';
import { ALL_ITEMS } from './InventoryDefinitions';
import type { AuditionDefinition } from './Performance';
import { ALL_RELATIONSHIP_CHARACTERS, CASTING_GATEKEEPER, SCENE_PARTNER } from './RelationshipDefinitions';
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
      { kind: 'xp-grant', amount: 40 },
      { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { trust: 10 } },
      { kind: 'set-fact', fact: 'screen-test:outcome:breakthrough' },
    ],
    'promising-complication': [
      { kind: 'resource-delta', delta: { reputation: 8 } },
      { kind: 'xp-grant', amount: 25 },
      { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { tension: 8 } },
      { kind: 'set-fact', fact: 'screen-test:outcome:promising-complication' },
    ],
    'wrong-role-right-notice': [
      { kind: 'resource-delta', delta: { reputation: 5 } },
      { kind: 'xp-grant', amount: 20 },
      { kind: 'relationship-delta', characterId: CASTING_GATEKEEPER.id, delta: { trust: 5 } },
      { kind: 'set-fact', fact: 'screen-test:outcome:wrong-role-right-notice' },
    ],
    'memorable-setback': [
      { kind: 'resource-delta', delta: { reputation: 1 } },
      { kind: 'xp-grant', amount: 10 },
      { kind: 'relationship-delta', characterId: SCENE_PARTNER.id, delta: { trust: 5 } },
      { kind: 'set-fact', fact: 'screen-test:outcome:memorable-setback' },
    ],
  },
};

export const ALL_AUDITIONS: readonly AuditionDefinition[] = [SCREEN_TEST_AUDITION];

validateAuditions(ALL_AUDITIONS, ALL_RELATIONSHIP_CHARACTERS, ALL_TALENTS, ALL_ITEMS);

export function getAuditionById(id: string): AuditionDefinition | undefined {
  return ALL_AUDITIONS.find((audition) => audition.id === id);
}
