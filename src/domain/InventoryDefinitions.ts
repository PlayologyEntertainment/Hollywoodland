import { validateInventoryItems } from '../content/InventoryValidator';
import type { InventoryItemDefinition } from './Inventory';

/** Debug content for the Phase 2 inventory-foundation round: one item per
 * category from the Vertical Slice Spec's Rewards row, loosely tied by
 * `unlockSource` to existing debug quest content (QuestDefinitions.ts) —
 * loosely because that reference isn't validated yet (see
 * InventoryValidator.ts); actually wiring a grant effect into quest/dialogue
 * rewards is next round's job. Final names and descriptions remain Owner
 * approval required, the same posture RelationshipDefinitions.ts and
 * TalentDefinitions.ts already take toward their own debug content. */
export const ALL_ITEMS: readonly InventoryItemDefinition[] = [
  {
    id: 'first-callback-slip',
    category: 'credit',
    name: 'Callback Slip',
    description: 'A carbon-copy slip proving you were called back for a real audition.',
    unlockSource: 'first-audition quest — callback stage reward',
  },
  {
    id: 'studio-headshot',
    category: 'headshot',
    name: 'Studio Headshot',
    description: 'A professional headshot, retouched and ready for the next casting call.',
    unlockSource: 'first-audition quest — callback stage reward',
  },
  {
    id: 'audition-dress',
    category: 'costume',
    name: 'Audition Dress',
    description: "A borrowed dress, pressed and ready for the screen test.",
    unlockSource: 'screen-test quest — attend stage reward',
  },
  {
    id: 'lucky-lipstick',
    category: 'prop',
    name: 'Lucky Lipstick',
    description: 'A half-used lipstick a fellow extra swears brings good luck.',
    unlockSource: 'screen-test quest — attend stage reward',
  },
  {
    id: 'boarding-house-photo-frame',
    category: 'home-display',
    name: 'Photo Frame',
    description: 'A small frame for the boarding-house room, waiting for its first photograph.',
    unlockSource: 'screen-test quest — attend stage reward',
  },
  {
    id: 'background-extra-voucher',
    category: 'credit',
    name: 'Background Extra Voucher',
    description: 'A same-day work slip clearing you for a paid day in the extras corral.',
    unlockSource: 'extras-call quest — cleared-for-call dialogue choice (granted directly, not a stage reward)',
  },
  {
    id: 'lookout-sides',
    category: 'prop',
    name: 'The Lookout\'s Sides',
    description: 'Three pages of pencilled script: the pickpocket in the harbor market who warns the heroine.',
    unlockSource: 'the-lookout quest — verdict dialogue choice (granted directly)',
  },
  {
    id: 'lookout-costume',
    category: 'costume',
    name: 'Harbor-Market Costume',
    description: 'A patched waistcoat, a striped sash and a cap pulled low: the Lookout, ready for the camera.',
    unlockSource: 'harbor-market-wardrobe quest — fitted stage reward',
  },
  {
    id: 'first-screen-credit',
    category: 'credit',
    name: 'Your First Screen Credit',
    description: 'A line on the call sheet of The Corsair\'s Daughter: the Lookout, with your name beside it.',
    unlockSource: 'first-day-on-set quest — earn-your-credit stage reward',
  },
  {
    id: 'publicity-card',
    category: 'prop',
    name: 'Publicity Card',
    description: 'A cream card with a gold studio crest and a telephone number. "Anything you need," it says, in a very small hand.',
    unlockSource: 'the-helpful-man quest — Pike\'s card, accepted (granted directly)',
  },
  {
    id: 'wrap-party-ribbon',
    category: 'home-display',
    name: 'Wrap Party Ribbon',
    description: 'A silk ribbon from the Celestial Palace ballroom, kept from the night the company of The Corsair\'s Daughter wrapped.',
    unlockSource: 'the-wrap-party quest — the-dance stage reward',
  },
];

validateInventoryItems(ALL_ITEMS);

export function getItemById(id: string): InventoryItemDefinition | undefined {
  return ALL_ITEMS.find((item) => item.id === id);
}
