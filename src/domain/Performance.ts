import type { AttributeKey } from './Origins';
import { BASE_ATTRIBUTE_VALUE } from './Origins';
import { applySharedEffect, evaluateSharedCondition, type FactCondition, type SharedEffect } from './Conditions';
import {
  evaluateInventoryCondition,
  type InventoryCondition,
  type InventoryItemDefinition,
} from './Inventory';
import { applyProgressionEffect, type ProgressionEffect } from './Progression';
import {
  applyRelationshipEffect,
  getRelationshipAxes,
  type RelationshipCharacter,
  type RelationshipEffect,
} from './Relationships';
import type { CareerState } from './CareerState';

/** The GDD's (§8) "Read the Room" signature audition system. `study` isn't
 * a category the player chooses from here — it's whatever preparation the
 * player already did before arriving (see `PreparationCheck` below), the
 * same way a quest's prerequisites are things the player already did rather
 * than a step of the quest itself. `technique` folds the GDD's Commit-step
 * "relevant learned technique" into a category alongside `intention` rather
 * than a separate mechanic, since both are choices made before performing.
 * `improvisation` is explicitly optional per the GDD — content authors a
 * no-risk baseline option (fit 0, no attribute/talent requirement) alongside
 * riskier ones rather than the engine special-casing "skip". */
export type AuditionCategoryKind =
  | 'intention'
  | 'technique'
  | 'delivery'
  | 'emotion'
  | 'blocking'
  | 'improvisation'
  | 'adaptation';

export interface AuditionOption {
  readonly id: string;
  readonly label: string;
  /** How well this specific choice fits the role and scene, authored per
   * definition. The dominant score input, alongside attributes/talents/
   * preparation below. */
  readonly fit: number;
  /** When set, the option leans on this attribute — its score contribution
   * is the attribute's distance from the baseline (`BASE_ATTRIBUTE_VALUE`),
   * the same delta Origins/Progression already express attribute bonuses
   * in, so a "5" attribute (the default) contributes nothing on its own. */
  readonly attribute?: AttributeKey;
  /** When set, unlocking this talent (see Progression.ts) adds a flat bonus —
   * the first content to give the talent tree a payoff beyond its own
   * attribute bonus. */
  readonly talentId?: string;
}

export interface AuditionCategory {
  readonly kind: AuditionCategoryKind;
  readonly prompt: string;
  readonly options: readonly AuditionOption[];
}

/** Something the player did *before* the audition that counts as
 * preparation — gathering script/genre/director/role/scene-partner
 * information per the GDD's Study step. Reuses the existing fact/item
 * condition shapes rather than inventing a third: preparation is either
 * something the content set as a fact (e.g. a prior quest stage) or an item
 * the player is carrying into the scene. */
export interface PreparationCheck {
  readonly condition: FactCondition | InventoryCondition;
  readonly label: string;
  readonly points: number;
}

export type AuditionOutcome =
  | 'breakthrough'
  | 'promising-complication'
  | 'wrong-role-right-notice'
  | 'memorable-setback';

export const ALL_AUDITION_OUTCOMES: readonly AuditionOutcome[] = [
  'breakthrough',
  'promising-complication',
  'wrong-role-right-notice',
  'memorable-setback',
];

export type AuditionOutcomeEffect = SharedEffect | ProgressionEffect | RelationshipEffect;

export interface AuditionDefinition {
  readonly id: string;
  readonly title: string;
  /** The attribute the role calls for. Used only to tell whether the
   * player's chosen options leaned toward a *different* attribute than the
   * role wants — see `deriveOutcome`'s "wrong role" branch — not as a score
   * input in its own right. */
  readonly featuredAttribute: AttributeKey;
  /** The roster id (see RelationshipDefinitions.ts) whose trust/tension with
   * the player colors the result — a scene partner who trusts you covers for
   * a shaky line; one you've been at odds with makes a strong take land as a
   * "promising complication" instead of a clean breakthrough. */
  readonly scenePartnerId: string;
  readonly preparationChecks: readonly PreparationCheck[];
  readonly categories: readonly AuditionCategory[];
  /** Authored per outcome family, the same way `QuestStage.rewards` carries
   * a stage's rewards rather than `Quests.ts` hardcoding what a stage grants —
   * `TypeScript`'s `Record` requires every outcome to be authored, so there's
   * no risk of an outcome silently granting nothing. */
  readonly outcomeEffects: Readonly<Record<AuditionOutcome, readonly AuditionOutcomeEffect[]>>;
}

/** Category kind -> the option id the player picked. A category absent from
 * this record (most relevantly `improvisation`, the GDD's one optional
 * category) simply contributes nothing to the score, rather than the engine
 * requiring every category to be answered. */
export type AuditionChoices = Readonly<Record<string, string>>;

export interface AuditionFactor {
  readonly label: string;
  readonly points: number;
}

export interface AuditionResult {
  readonly outcome: AuditionOutcome;
  readonly score: number;
  /** Sorted most-significant-first, per the GDD's "the debrief communicates
   * the most important contributing factors" — outcomes here are always a
   * transparent sum of authored factors, never unexplained randomness. */
  readonly factors: readonly AuditionFactor[];
}

const BREAKTHROUGH_SCORE = 8;
const PROMISING_SCORE = 4;
const WRONG_ROLE_SCORE = 0;

/** A scene partner's tension undercutting an otherwise clean take, per the
 * GDD's "promising complication: the studio is interested, but a
 * relationship, reputation, or contract issue creates a new problem." */
const TENSION_COMPLICATION_MIN = 50;

const TALENT_BONUS = 2;
const RELATIONSHIP_TRUST_DIVISOR = 25;

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function evaluatePreparationCheck(
  state: CareerState,
  check: PreparationCheck,
  items: readonly InventoryItemDefinition[],
): boolean {
  if (check.condition.kind === 'item-owned') return evaluateInventoryCondition(state, check.condition, items);
  return evaluateSharedCondition(state, check.condition);
}

/** Whichever attribute the player leaned on most across their chosen
 * options doesn't match the role's featured attribute. Ties, or a scene with
 * no attribute-linked choices at all, favor the role rather than flagging a
 * mismatch — "wrong role" should follow from a clear pattern in the choices
 * made, not a coin flip. */
function leansOffFeaturedAttribute(chosenAttributes: readonly AttributeKey[], featured: AttributeKey): boolean {
  if (chosenAttributes.length === 0) return false;
  const counts = new Map<AttributeKey, number>();
  for (const attribute of chosenAttributes) counts.set(attribute, (counts.get(attribute) ?? 0) + 1);
  const featuredCount = counts.get(featured) ?? 0;
  let maxOtherCount = 0;
  for (const [attribute, count] of counts) {
    if (attribute !== featured) maxOtherCount = Math.max(maxOtherCount, count);
  }
  return maxOtherCount > featuredCount;
}

function deriveOutcome(
  score: number,
  scenePartnerTension: number,
  featuredAttribute: AttributeKey,
  chosenAttributes: readonly AttributeKey[],
): AuditionOutcome {
  if (score >= BREAKTHROUGH_SCORE) {
    return scenePartnerTension >= TENSION_COMPLICATION_MIN ? 'promising-complication' : 'breakthrough';
  }
  if (score >= PROMISING_SCORE) {
    return leansOffFeaturedAttribute(chosenAttributes, featuredAttribute)
      ? 'wrong-role-right-notice'
      : 'promising-complication';
  }
  if (score >= WRONG_ROLE_SCORE) return 'wrong-role-right-notice';
  return 'memorable-setback';
}

/** Resolves a Read the Room performance into one of the four outcome-matrix
 * families, purely as a function of state, authored content, and the
 * player's choices — no randomness, so the same inputs always produce the
 * same result and debrief. Does not mutate state; see `applyAuditionOutcome`
 * for turning the result into a state change. */
export function resolveAudition(
  state: CareerState,
  definition: AuditionDefinition,
  choices: AuditionChoices,
  roster: readonly RelationshipCharacter[],
  items: readonly InventoryItemDefinition[] = [],
): AuditionResult {
  const factors: AuditionFactor[] = [];
  let score = 0;

  for (const check of definition.preparationChecks) {
    if (!evaluatePreparationCheck(state, check, items)) continue;
    score += check.points;
    factors.push({ label: check.label, points: check.points });
  }

  const chosenAttributes: AttributeKey[] = [];
  for (const category of definition.categories) {
    const option = category.options.find((candidate) => candidate.id === choices[category.kind]);
    if (option === undefined) continue;

    score += option.fit;
    factors.push({ label: option.label, points: option.fit });

    if (option.attribute !== undefined) {
      chosenAttributes.push(option.attribute);
      const attributePoints = state.attributes[option.attribute] - BASE_ATTRIBUTE_VALUE;
      if (attributePoints !== 0) {
        score += attributePoints;
        factors.push({ label: `${capitalize(option.attribute)} carried it`, points: attributePoints });
      }
    }

    if (option.talentId !== undefined && (state.progression.unlockedTalentIds[option.talentId] ?? false)) {
      score += TALENT_BONUS;
      factors.push({ label: 'Trained technique paid off', points: TALENT_BONUS });
    }
  }

  const scenePartner = roster.find((character) => character.id === definition.scenePartnerId);
  const scenePartnerAxes = scenePartner === undefined ? undefined : getRelationshipAxes(state.relationships, scenePartner);
  const scenePartnerTension = scenePartnerAxes?.tension ?? 0;
  if (scenePartnerAxes !== undefined) {
    const trustPoints = Math.round(scenePartnerAxes.trust / RELATIONSHIP_TRUST_DIVISOR);
    if (trustPoints !== 0) {
      score += trustPoints;
      factors.push({ label: 'Your scene partner has your back', points: trustPoints });
    }
  }

  const outcome = deriveOutcome(score, scenePartnerTension, definition.featuredAttribute, chosenAttributes);
  const sortedFactors = [...factors].sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
  return { outcome, score, factors: sortedFactors };
}

function applyAuditionOutcomeEffect(
  state: CareerState,
  effect: AuditionOutcomeEffect,
  roster: readonly RelationshipCharacter[],
): CareerState {
  if (effect.kind === 'xp-grant') return applyProgressionEffect(state, effect);
  if (effect.kind === 'relationship-delta' || effect.kind === 'relationship-pivotal-flag') {
    return applyRelationshipEffect(state, effect, roster);
  }
  return applySharedEffect(state, effect);
}

/** Applies whichever outcome family's authored effects match `result.outcome`.
 * Kept separate from `resolveAudition` the way `getQuestStatus` (read) stays
 * separate from `completeQuestStage` (write) — a caller may want the result
 * for a debrief screen before committing it to state. */
export function applyAuditionOutcome(
  state: CareerState,
  definition: AuditionDefinition,
  result: AuditionResult,
  roster: readonly RelationshipCharacter[],
): CareerState {
  const effects = definition.outcomeEffects[result.outcome];
  return effects.reduce((current, effect) => applyAuditionOutcomeEffect(current, effect, roster), state);
}
