/** The screen-reader descriptions of the character portraits shown over each building's dialogue, by location key. The English
 * lives here (not inline in the shell) so the catalog extractor can read it; the shell looks each one up through
 * `sceneArtAlt` (src/i18n/content.ts). */
export const SCENE_ART_ALT: Readonly<Record<string, string>> = Object.freeze({
  'casting-office': 'The casting-office clerk',
  'boarding-house': 'The Bellhaven Rooms landlady',
  diner: 'The counter girl at The Gilded Spoon',
  'backlot-gate': 'The rival at the Monarch Pictures gate',
  'extras-corral': 'The production coordinator',
  soundstage: 'The scene partner',
  'costume-shop': 'The wardrobe mistress at The Silver Thimble',
  'klieg-light-office': 'The newspaper stringer at The Klieg Light',
  'celestial-palace': 'The house manager of The Celestial Palace',
});
