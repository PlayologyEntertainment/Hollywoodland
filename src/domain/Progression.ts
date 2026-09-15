import { MAX_ATTRIBUTE_VALUE, type AttributeKey, type AttributesState } from './Origins';
import type { CareerState } from './CareerState';

/** The Vertical Slice Spec's (§3) seven initial talent branches, each
 * sitting beneath one of the five attributes (see Origins.ts). Multiple
 * branches may share an attribute — there are more branches than
 * attributes, so overlap is expected rather than a 1:1 mapping. */
export type TalentBranch = 'drama' | 'comedy' | 'dance' | 'charm' | 'hustle' | 'observation' | 'stagecraft';

/** A node in a branch's talent tree. `prerequisiteId`, when set, must name
 * another talent in the *same* branch — see TalentValidator.ts — keeping
 * each branch a self-contained tree rather than a tangle across branches.
 * Per the GDD's "XP levels grant a controlled attribute improvement and a
 * perk/talent choice": this round ties both halves of that sentence
 * together into one action — unlocking a talent both spends the point and
 * applies its (small, authored) `attributeBonus` — rather than introducing
 * a second, independent free-attribute-pick mechanic the design docs don't
 * otherwise describe. */
export interface TalentDefinition {
  readonly id: string;
  readonly branch: TalentBranch;
  readonly name: string;
  readonly description: string;
  readonly attribute: AttributeKey;
  readonly attributeBonus: number;
  readonly cost: number;
  readonly prerequisiteId: string | null;
}

export interface ProgressionState {
  readonly xp: number;
  readonly level: number;
  readonly unspentTalentPoints: number;
  readonly unlockedTalentIds: Readonly<Record<string, boolean>>;
}

export const DEFAULT_PROGRESSION: ProgressionState = Object.freeze({
  xp: 0,
  level: 1,
  unspentTalentPoints: 0,
  unlockedTalentIds: Object.freeze({}),
});

const BASE_XP_TO_LEVEL = 40;
const XP_GROWTH_PER_LEVEL = 20;

/** XP needed to advance from `level` to `level + 1`. A flat, increasing
 * curve rather than authored per-level content — nothing here needs to be
 * kept in sync with a second place the way a quest or dialogue node would. */
export function xpRequiredForNextLevel(level: number): number {
  return BASE_XP_TO_LEVEL + (level - 1) * XP_GROWTH_PER_LEVEL;
}

/** Grants XP and levels up as many times as a large-enough gain warrants
 * (a defensive loop, not just a single ++level — the same posture a big
 * `resource-delta` reward already gets from `applyResourceDelta`'s
 * clamping). Each level grants exactly one unspent talent point; a
 * negative or zero amount is a no-op rather than letting XP go backwards. */
export function applyXpGain(progression: ProgressionState, amount: number): ProgressionState {
  if (amount <= 0) return progression;
  let xp = progression.xp + amount;
  let level = progression.level;
  let unspentTalentPoints = progression.unspentTalentPoints;
  let threshold = xpRequiredForNextLevel(level);
  while (xp >= threshold) {
    xp -= threshold;
    level += 1;
    unspentTalentPoints += 1;
    threshold = xpRequiredForNextLevel(level);
  }
  return { ...progression, xp, level, unspentTalentPoints };
}

export function isTalentUnlocked(progression: ProgressionState, talent: TalentDefinition): boolean {
  return progression.unlockedTalentIds[talent.id] ?? false;
}

/** A talent can be unlocked once: enough unspent points remain, it isn't
 * already unlocked, and (when it has one) its same-branch prerequisite is
 * already unlocked. Operates on `ProgressionState` alone — unlike
 * `unlockTalent`, this doesn't need to know about attributes. */
export function canUnlockTalent(progression: ProgressionState, talent: TalentDefinition): boolean {
  if (isTalentUnlocked(progression, talent)) return false;
  if (progression.unspentTalentPoints < talent.cost) return false;
  if (talent.prerequisiteId !== null && (progression.unlockedTalentIds[talent.prerequisiteId] ?? false) !== true) {
    return false;
  }
  return true;
}

/** No-ops when `canUnlockTalent` disallows it — the same defensive posture
 * `completeQuestStage` takes toward a stale or out-of-order content
 * reference, rather than throwing. Spends the point and applies the
 * talent's attribute bonus in the same step (clamped to
 * `MAX_ATTRIBUTE_VALUE`, same bound Origins.ts already enforces). */
export function unlockTalent(state: CareerState, talent: TalentDefinition): CareerState {
  if (!canUnlockTalent(state.progression, talent)) return state;
  return {
    ...state,
    progression: {
      ...state.progression,
      unspentTalentPoints: state.progression.unspentTalentPoints - talent.cost,
      unlockedTalentIds: { ...state.progression.unlockedTalentIds, [talent.id]: true },
    },
    attributes: applyAttributeBonus(state.attributes, talent.attribute, talent.attributeBonus),
  };
}

function applyAttributeBonus(attributes: AttributesState, key: AttributeKey, bonus: number): AttributesState {
  return { ...attributes, [key]: Math.min(MAX_ATTRIBUTE_VALUE, attributes[key] + bonus) };
}

export interface LevelAtLeastCondition {
  readonly kind: 'level-at-least';
  readonly minimum: number;
}

export interface TalentUnlockedCondition {
  readonly kind: 'talent-unlocked';
  readonly talentId: string;
}

export type ProgressionCondition = LevelAtLeastCondition | TalentUnlockedCondition;

export interface XpGrantEffect {
  readonly kind: 'xp-grant';
  readonly amount: number;
}

/** The sole progression effect this round wires into dialogue/quest
 * content. Deliberately no `talent-unlock` effect alongside it: per the
 * GDD, a level grants "a perk/talent choice" — spending a point is the
 * player's decision, made through a UI this round doesn't build (the same
 * posture round 7 took toward relationship state before adding a UI for
 * it), not something dialogue or a quest reward should do on the player's
 * behalf. `talent-unlocked` below is still a valid *condition* — content
 * can react to an already-unlocked talent — it just isn't reachable from
 * any authored content yet, the same way `relationship-label` shipped
 * fully validated and tested before any content used it. */
export type ProgressionEffect = XpGrantEffect;

export function evaluateProgressionCondition(state: CareerState, condition: ProgressionCondition): boolean {
  if (condition.kind === 'level-at-least') return state.progression.level >= condition.minimum;
  return (state.progression.unlockedTalentIds[condition.talentId] ?? false) === true;
}

export function applyProgressionEffect(state: CareerState, effect: ProgressionEffect): CareerState {
  return { ...state, progression: applyXpGain(state.progression, effect.amount) };
}
