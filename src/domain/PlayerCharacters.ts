/** The six ready-made characters a player chooses between in the Character Creator. Pure data, so the choice, its saved id
 * and its art paths are unit-tested without a browser.
 *
 * The choice is cosmetic: it decides the headshot, the full-size portrait and the walk cycle used on the Boulevard. The order
 * is the order shown (the three men, then the three women) and is also the default-selection order, so add new characters to
 * the end and never reuse an id: it is stored in saves. */

export type PlayerCharacterId = 'white-male' | 'asian-male' | 'black-male' | 'white-female' | 'asian-female' | 'black-female';

export interface PlayerCharacter {
  readonly id: PlayerCharacterId;
  /** A description for screen readers. It names hair and clothes, so two characters never sound alike. */
  readonly label: string;
  /** Path under public/ of the square headshot shown in the selector. */
  readonly headshot: string;
  /** Path under public/ of the full-size, head-to-toe portrait shown in the centre pane. */
  readonly portrait: string;
  /** Path under public/ of the floor reflection of the portrait's feet, drawn under the figure in the centre pane. */
  readonly reflection: string;
  /** Path under public/ of this character's walk-cycle config (sheet, stride and footprints); see WalkCycle.ts. */
  readonly walkCycle: string;
}

const art = (id: PlayerCharacterId, kind: 'headshot' | 'portrait' | 'reflection'): string => `assets/characters/player/${id}-${kind}.webp`;

export const PLAYER_CHARACTERS: readonly PlayerCharacter[] = [
  {
    id: 'white-male',
    label: 'Man with dark wavy hair, a cream shirt and brown suspenders',
    headshot: art('white-male', 'headshot'),
    portrait: art('white-male', 'portrait'),
    reflection: art('white-male', 'reflection'),
    walkCycle: 'data/walk-cycle.json',
  },
  {
    id: 'asian-male',
    label: 'Man with a neat side part, a sage-green shirt and tan suspenders',
    headshot: art('asian-male', 'headshot'),
    portrait: art('asian-male', 'portrait'),
    reflection: art('asian-male', 'reflection'),
    walkCycle: 'data/walk-cycle.json',
  },
  {
    id: 'black-male',
    label: 'Man with short tapered hair, a terracotta shirt and dark suspenders',
    headshot: art('black-male', 'headshot'),
    portrait: art('black-male', 'portrait'),
    reflection: art('black-male', 'reflection'),
    walkCycle: 'data/walk-cycle.json',
  },
  {
    id: 'white-female',
    label: 'Woman with auburn waves and a sky-blue blouse',
    headshot: art('white-female', 'headshot'),
    portrait: art('white-female', 'portrait'),
    reflection: art('white-female', 'reflection'),
    walkCycle: 'data/walk-cycle-white-female.json',
  },
  {
    id: 'asian-female',
    label: 'Woman with a black bob and a dusty-rose blouse',
    headshot: art('asian-female', 'headshot'),
    portrait: art('asian-female', 'portrait'),
    reflection: art('asian-female', 'reflection'),
    walkCycle: 'data/walk-cycle.json',
  },
  {
    id: 'black-female',
    label: 'Woman with short natural curls and a mustard-yellow blouse',
    headshot: art('black-female', 'headshot'),
    portrait: art('black-female', 'portrait'),
    reflection: art('black-female', 'reflection'),
    walkCycle: 'data/walk-cycle.json',
  },
];

/** The character used when none has been chosen: a save made before characters existed, or a new career started without
 * going through the creator. It is the young actor the game began with. */
export const DEFAULT_PLAYER_CHARACTER_ID: PlayerCharacterId = 'white-male';

/** The character for a saved id, falling back to the default for a missing or unknown one. */
export function getPlayerCharacter(id: string | undefined): PlayerCharacter {
  const found = PLAYER_CHARACTERS.find((character) => character.id === id);
  if (found !== undefined) return found;
  const fallback = PLAYER_CHARACTERS.find((character) => character.id === DEFAULT_PLAYER_CHARACTER_ID);
  if (fallback === undefined) throw new Error('The default player character is missing from the roster.');
  return fallback;
}
