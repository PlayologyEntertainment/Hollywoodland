import type { CareerState } from './CareerState';

export type RelationshipLabel = 'neutral' | 'friendship' | 'rivalry' | 'romance' | 'alliance' | 'estrangement';

/** Per the GDD's "full relationship web" (§7): a small authored set of
 * states per character rather than one universal affection score. `trust`
 * and `tension` are independent meters (a relationship can be high-trust
 * and high-tension at once, e.g. a respected rival) rather than opposite
 * ends of one scale. `attraction` is `null` for characters the content
 * marks as not romance-capable (see RelationshipCharacter.supportsAttraction)
 * so "no romance track" is representable instead of merely "romance at
 * zero". `pivotalFlags` holds one-way story beats, mirroring how
 * CareerState.facts remembers dialogue/quest beats. */
export interface RelationshipAxes {
  readonly trust: number;
  readonly tension: number;
  readonly attraction: number | null;
  /** A signed favor ledger: positive means the character owes the player
   * (the player did them a favor), negative means the player owes the
   * character (the player called in a favor from them). */
  readonly obligation: number;
  readonly pivotalFlags: Readonly<Record<string, boolean>>;
}

export type RelationshipState = Readonly<Record<string, RelationshipAxes>>;

export const DEFAULT_RELATIONSHIPS: RelationshipState = Object.freeze({});

const MIN_METER = 0;
const MAX_METER = 100;
const MIN_OBLIGATION = -20;
const MAX_OBLIGATION = 20;

/** A character's identity as far as the relationship system cares: enough
 * to key state and to know whether attraction applies. Content modules
 * (see RelationshipDefinitions.ts) provide the full authored definition;
 * this is the minimal shape every relationship function needs. */
export interface RelationshipCharacter {
  readonly id: string;
  readonly supportsAttraction: boolean;
}

export function createDefaultRelationshipAxes(character: RelationshipCharacter): RelationshipAxes {
  return {
    trust: 0,
    tension: 0,
    attraction: character.supportsAttraction ? 0 : null,
    obligation: 0,
    pivotalFlags: Object.freeze({}),
  };
}

/** Falls back to the character's default axes when the roster hasn't
 * touched this state yet — the same lazy-population approach CareerState.facts
 * uses, so an untouched character needs no upfront entry. */
export function getRelationshipAxes(relationships: RelationshipState, character: RelationshipCharacter): RelationshipAxes {
  return relationships[character.id] ?? createDefaultRelationshipAxes(character);
}

export interface RelationshipDelta {
  readonly trust?: number;
  readonly tension?: number;
  readonly attraction?: number;
  readonly obligation?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** An attraction delta no-ops on a character whose axes don't track it
 * (`attraction === null`) rather than throwing — the same defensive
 * posture `completeQuestStage` takes toward a stale content reference. */
export function applyRelationshipAxesDelta(axes: RelationshipAxes, delta: RelationshipDelta): RelationshipAxes {
  return {
    ...axes,
    trust: clamp(axes.trust + (delta.trust ?? 0), MIN_METER, MAX_METER),
    tension: clamp(axes.tension + (delta.tension ?? 0), MIN_METER, MAX_METER),
    attraction: axes.attraction === null ? null : clamp(axes.attraction + (delta.attraction ?? 0), MIN_METER, MAX_METER),
    obligation: clamp(axes.obligation + (delta.obligation ?? 0), MIN_OBLIGATION, MAX_OBLIGATION),
  };
}

export function applyRelationshipDelta(
  relationships: RelationshipState,
  character: RelationshipCharacter,
  delta: RelationshipDelta,
): RelationshipState {
  const nextAxes = applyRelationshipAxesDelta(getRelationshipAxes(relationships, character), delta);
  return { ...relationships, [character.id]: nextAxes };
}

export function setRelationshipPivotalFlag(
  relationships: RelationshipState,
  character: RelationshipCharacter,
  flag: string,
  value = true,
): RelationshipState {
  const axes = getRelationshipAxes(relationships, character);
  return {
    ...relationships,
    [character.id]: { ...axes, pivotalFlags: { ...axes.pivotalFlags, [flag]: value } },
  };
}

const TRUST_ESTRANGEMENT_MAX = 20;
const TENSION_HIGH = 60;
const TRUST_ROMANCE_MIN = 40;
const ATTRACTION_ROMANCE_MIN = 60;
const TRUST_ALLIANCE_MIN = 40;
const OBLIGATION_ALLIANCE_MIN = 10;
const TRUST_FRIENDSHIP_MIN = 60;

/** Composite label derived purely from the four numeric axes — no authored
 * transition content, so there's no second place for writers to keep in
 * sync with the meters. Checked most-specific-first: a full breakdown of
 * trust reads as estrangement even where the tension level alone would
 * also qualify as rivalry, and romance takes precedence over alliance
 * when both thresholds happen to be met. */
export function deriveRelationshipLabel(axes: RelationshipAxes): RelationshipLabel {
  if (axes.trust <= TRUST_ESTRANGEMENT_MAX && axes.tension >= TENSION_HIGH) return 'estrangement';
  if (axes.attraction !== null && axes.attraction >= ATTRACTION_ROMANCE_MIN && axes.trust >= TRUST_ROMANCE_MIN) {
    return 'romance';
  }
  if (axes.tension >= TENSION_HIGH) return 'rivalry';
  if (Math.abs(axes.obligation) >= OBLIGATION_ALLIANCE_MIN && axes.trust >= TRUST_ALLIANCE_MIN) return 'alliance';
  if (axes.trust >= TRUST_FRIENDSHIP_MIN) return 'friendship';
  return 'neutral';
}

export function getRelationshipLabel(relationships: RelationshipState, character: RelationshipCharacter): RelationshipLabel {
  return deriveRelationshipLabel(getRelationshipAxes(relationships, character));
}

/** Numeric axis a `RelationshipAtLeastCondition` can threshold on. Matches
 * the keys `RelationshipDelta` can adjust. */
export type RelationshipAxisKey = 'trust' | 'tension' | 'attraction' | 'obligation';

export interface RelationshipAtLeastCondition {
  readonly kind: 'relationship-at-least';
  readonly characterId: string;
  readonly axis: RelationshipAxisKey;
  readonly minimum: number;
}

export interface RelationshipLabelCondition {
  readonly kind: 'relationship-label';
  readonly characterId: string;
  readonly label: RelationshipLabel;
}

export type RelationshipCondition = RelationshipAtLeastCondition | RelationshipLabelCondition;

export interface RelationshipDeltaEffect {
  readonly kind: 'relationship-delta';
  readonly characterId: string;
  readonly delta: RelationshipDelta;
}

export interface RelationshipPivotalFlagEffect {
  readonly kind: 'relationship-pivotal-flag';
  readonly characterId: string;
  readonly flag: string;
  readonly value?: boolean;
}

export type RelationshipEffect = RelationshipDeltaEffect | RelationshipPivotalFlagEffect;

function findRelationshipCharacter(
  roster: readonly RelationshipCharacter[],
  characterId: string,
): RelationshipCharacter | undefined {
  return roster.find((character) => character.id === characterId);
}

/** A dangling `characterId` (content authored against a roster this call
 * wasn't given, or a stale reference) resolves to `false` rather than
 * throwing — the same defensive posture `evaluateQuestCondition` takes
 * toward a dangling quest-status target. An `attraction` check against a
 * character whose axes don't track it (`attraction === null`) is likewise
 * never satisfied, rather than a type error at runtime. */
export function evaluateRelationshipCondition(
  state: CareerState,
  condition: RelationshipCondition,
  roster: readonly RelationshipCharacter[],
): boolean {
  const character = findRelationshipCharacter(roster, condition.characterId);
  if (character === undefined) return false;
  const axes = getRelationshipAxes(state.relationships, character);
  if (condition.kind === 'relationship-label') {
    return deriveRelationshipLabel(axes) === condition.label;
  }
  const value = axes[condition.axis];
  return value !== null && value >= condition.minimum;
}

/** No-ops on a dangling `characterId`, mirroring `applyQuestActionById`'s
 * style — the payload crosses content-authoring/dialogue-effect
 * boundaries where a stale reference is a legitimate defensive case, not
 * a crash. */
export function applyRelationshipEffect(
  state: CareerState,
  effect: RelationshipEffect,
  roster: readonly RelationshipCharacter[],
): CareerState {
  const character = findRelationshipCharacter(roster, effect.characterId);
  if (character === undefined) return state;
  if (effect.kind === 'relationship-pivotal-flag') {
    return {
      ...state,
      relationships: setRelationshipPivotalFlag(state.relationships, character, effect.flag, effect.value ?? true),
    };
  }
  return { ...state, relationships: applyRelationshipDelta(state.relationships, character, effect.delta) };
}
