import { validateRelationshipRoster } from '../content/RelationshipValidator';
import type { RelationshipCharacter } from './Relationships';

export interface RelationshipCharacterDef extends RelationshipCharacter {
  readonly role: string;
}

/** Debug content for the Phase 2 relationship-web round: nine role-based
 * placeholders spanning the recurring-cast relationship boundaries the GDD
 * (§7) and docs/DRAFT_TRACK_B_CANON_PROPOSAL.md describe — mentor-only,
 * obligation-only, romance-capable, and so on — without adopting any of the
 * draft's proposed names, which remain Owner approval required. This
 * content exercises the relationship engine's full range of
 * configurations, the same way the casting-office dialogue and first-
 * audition quest exercise their engines without locking in narrative. */
export const RIVAL: RelationshipCharacterDef = { id: 'rival', role: 'Rival / foil', supportsAttraction: true };
export const LANDLADY: RelationshipCharacterDef = {
  id: 'landlady',
  role: 'Boarding-house proprietor',
  supportsAttraction: false,
};
export const DINER_CONFIDANT: RelationshipCharacterDef = {
  id: 'diner-confidant',
  role: 'Diner worker / confidant',
  supportsAttraction: true,
};
export const CASTING_GATEKEEPER: RelationshipCharacterDef = {
  id: 'casting-gatekeeper',
  role: 'Casting-office gatekeeper',
  supportsAttraction: false,
};
export const PRODUCTION_COORDINATOR: RelationshipCharacterDef = {
  id: 'production-coordinator',
  role: 'Assistant director / production coordinator',
  supportsAttraction: false,
};
export const MENTOR_EXTRA: RelationshipCharacterDef = {
  id: 'mentor-extra',
  role: 'Experienced extra / mentor',
  supportsAttraction: false,
};
export const SCENE_PARTNER: RelationshipCharacterDef = {
  id: 'scene-partner',
  role: 'Scene partner',
  supportsAttraction: true,
};
export const REPORTER: RelationshipCharacterDef = {
  id: 'reporter',
  role: 'Reporter / gossip-adjacent',
  supportsAttraction: false,
};
export const WARDROBE_MENTOR: RelationshipCharacterDef = {
  id: 'wardrobe-mentor',
  role: 'Origin-linked specialist',
  supportsAttraction: false,
};
/** The Celestial Palace's house manager (Lucian Vale in the proposed canon,
 * pending owner approval): a trust/obligation character who trades in favors
 * of seats, with no romance track. */
export const HOUSE_MANAGER: RelationshipCharacterDef = {
  id: 'house-manager',
  role: 'Movie-palace house manager',
  supportsAttraction: false,
};

export const ALL_RELATIONSHIP_CHARACTERS: readonly RelationshipCharacterDef[] = [
  RIVAL,
  LANDLADY,
  DINER_CONFIDANT,
  CASTING_GATEKEEPER,
  PRODUCTION_COORDINATOR,
  MENTOR_EXTRA,
  SCENE_PARTNER,
  REPORTER,
  WARDROBE_MENTOR,
  HOUSE_MANAGER,
];

validateRelationshipRoster(ALL_RELATIONSHIP_CHARACTERS);

export function getRelationshipCharacterById(id: string): RelationshipCharacterDef | undefined {
  return ALL_RELATIONSHIP_CHARACTERS.find((character) => character.id === id);
}
