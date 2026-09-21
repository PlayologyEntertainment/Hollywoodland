import { DEFAULT_ATTRIBUTES, type AttributesState } from './Origins';
import { DEFAULT_ASSIGNMENTS, type ActiveAssignmentState, type AssignmentsState } from './Assignments';
import { DEFAULT_RESOURCES, type ResourcesState } from './EconomySystem';
import { DEFAULT_HOUSING, type HousingState, type HousingTier } from './Housing';
import { DEFAULT_INVENTORY, type InventoryState } from './Inventory';
import { DEFAULT_PROGRESSION, type ProgressionState } from './Progression';
import { DEFAULT_RELATIONSHIPS, type RelationshipAxes, type RelationshipState } from './Relationships';
import { DEFAULT_TIME, type TimeState } from './TimeSystem';

export interface IdentityState {
  readonly name: string;
  readonly originId: string;
  /** Left over from the customisable creator; new careers always store 0. Kept so older saves stay valid. */
  readonly skinToneIndex: number;
  /** Left over from the customisable creator; new careers always store an empty record. Kept so older saves stay valid. */
  readonly appearance: Readonly<Record<string, number>>;
  /** Which ready-made character the player chose (see PlayerCharacters.ts). Optional so saves made before characters
   * existed stay valid without a migration; a missing or unknown id means the default character. */
  readonly characterId?: string;
}

export const DEFAULT_IDENTITY: IdentityState = Object.freeze({
  name: '',
  originId: '',
  skinToneIndex: 0,
  appearance: Object.freeze({}),
});

export interface WorldFlagsState {
  readonly discoveredCastingOffice: boolean;
}

export const DEFAULT_FLAGS: WorldFlagsState = Object.freeze({ discoveredCastingOffice: false });

export const DEFAULT_PLAYER_X = 420;

export const DEFAULT_FACTS: Readonly<Record<string, boolean>> = Object.freeze({});

export interface CareerState {
  readonly playerX: number;
  readonly identity: IdentityState;
  readonly attributes: AttributesState;
  readonly time: TimeState;
  readonly resources: ResourcesState;
  readonly flags: WorldFlagsState;
  /** Open-ended, content-keyed facts remembered by dialogue and quest
   * content — distinct from the fixed-key WorldFlagsState. */
  readonly facts: Readonly<Record<string, boolean>>;
  /** Per-character relationship meters (round 4), keyed by the roster ids
   * in domain/RelationshipDefinitions.ts. Lazily populated — an id absent
   * from this record simply hasn't been touched yet; see
   * Relationships.ts's getRelationshipAxes for the default it falls back
   * to — the same lazy-population approach `facts` uses. */
  readonly relationships: RelationshipState;
  /** XP, level, and unlocked talents (round 8). Unlike `relationships`,
   * this isn't lazily populated — every career starts at level 1 with
   * `DEFAULT_PROGRESSION` rather than an absent entry, since there's only
   * ever one progression track (not one per authored id) to default. */
  readonly progression: ProgressionState;
  /** Owned reward items (round 11), keyed by the debug roster ids in
   * domain/InventoryDefinitions.ts. Lazily populated like `relationships` —
   * an absent id simply hasn't been earned yet. */
  readonly inventory: InventoryState;
  /** Housing tier (round N): gates which idle/offline assignments are
   * available — see domain/Assignments.ts. */
  readonly housing: HousingState;
  /** The single scheduled idle/offline assignment, if any (round N). One at
   * a time for now; a later housing tier could raise this to multiple
   * concurrent slots without changing this field's shape. */
  readonly assignments: AssignmentsState;

  // Quest graph progress (round 3) deliberately does NOT get its own field
  // here — it's tracked through `facts` (see domain/Quests.ts), the same
  // way dialogue memory is. Don't add a dedicated QuestState field; that
  // would duplicate state-tracking machinery `facts` already provides.
}

export function createInitialCareerState(identity: IdentityState, attributes: AttributesState): CareerState {
  return {
    playerX: DEFAULT_PLAYER_X,
    identity,
    attributes,
    time: DEFAULT_TIME,
    resources: DEFAULT_RESOURCES,
    flags: DEFAULT_FLAGS,
    facts: DEFAULT_FACTS,
    relationships: DEFAULT_RELATIONSHIPS,
    progression: DEFAULT_PROGRESSION,
    inventory: DEFAULT_INVENTORY,
    housing: DEFAULT_HOUSING,
    assignments: DEFAULT_ASSIGNMENTS,
  };
}

export function createDefaultCareerState(): CareerState {
  return createInitialCareerState(DEFAULT_IDENTITY, DEFAULT_ATTRIBUTES);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIdentityState(value: unknown): value is IdentityState {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    typeof value.originId === 'string' &&
    typeof value.skinToneIndex === 'number' &&
    isRecord(value.appearance) &&
    (value.characterId === undefined || typeof value.characterId === 'string')
  );
}

function isResourcesState(value: unknown): value is ResourcesState {
  return (
    isRecord(value) &&
    typeof value.money === 'number' &&
    typeof value.energy === 'number' &&
    typeof value.reputation === 'number'
  );
}

function isTimeState(value: unknown): value is TimeState {
  return (
    isRecord(value) &&
    typeof value.day === 'number' &&
    (value.slot === 'morning' || value.slot === 'afternoon' || value.slot === 'evening')
  );
}

function isAttributesState(value: unknown): value is AttributesState {
  return (
    isRecord(value) &&
    (['presence', 'craft', 'wit', 'nerve', 'grit'] as const).every((key) => typeof value[key] === 'number')
  );
}

function isWorldFlagsState(value: unknown): value is WorldFlagsState {
  return isRecord(value) && typeof value.discoveredCastingOffice === 'boolean';
}

function isFactsState(value: unknown): value is Readonly<Record<string, boolean>> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === 'boolean');
}

function isRelationshipAxes(value: unknown): value is RelationshipAxes {
  return (
    isRecord(value) &&
    typeof value.trust === 'number' &&
    typeof value.tension === 'number' &&
    (value.attraction === null || typeof value.attraction === 'number') &&
    typeof value.obligation === 'number' &&
    isRecord(value.pivotalFlags) &&
    Object.values(value.pivotalFlags).every((entry) => typeof entry === 'boolean')
  );
}

function isRelationshipState(value: unknown): value is RelationshipState {
  return isRecord(value) && Object.values(value).every((entry) => isRelationshipAxes(entry));
}

function isProgressionState(value: unknown): value is ProgressionState {
  return (
    isRecord(value) &&
    typeof value.xp === 'number' &&
    typeof value.level === 'number' &&
    typeof value.unspentTalentPoints === 'number' &&
    isRecord(value.unlockedTalentIds) &&
    Object.values(value.unlockedTalentIds).every((entry) => typeof entry === 'boolean')
  );
}

/** The pre-round-2 CareerState shape (no remembered facts). Exported only
 * for save migration (see SaveEnvelope.ts) — nothing else should use this. */
export function isCareerStateShapeV2(value: unknown): value is Omit<CareerState, 'facts' | 'relationships'> {
  return (
    isRecord(value) &&
    typeof value.playerX === 'number' &&
    isIdentityState(value.identity) &&
    isAttributesState(value.attributes) &&
    isTimeState(value.time) &&
    isResourcesState(value.resources) &&
    isWorldFlagsState(value.flags)
  );
}

/** The pre-round-4 CareerState shape (facts, but no relationship meters).
 * Exported only for save migration (see SaveEnvelope.ts) — nothing else
 * should use this. */
export function isCareerStateShapeV3(value: unknown): value is Omit<CareerState, 'relationships'> {
  return isCareerStateShapeV2(value) && isFactsState((value as Record<string, unknown>).facts);
}

/** The pre-round-8 CareerState shape (relationship meters, but no
 * progression). Exported only for save migration (see SaveEnvelope.ts) —
 * nothing else should use this. */
export function isCareerStateShapeV4(value: unknown): value is Omit<CareerState, 'progression' | 'inventory'> {
  return isCareerStateShapeV3(value) && isRelationshipState((value as Record<string, unknown>).relationships);
}

/** The pre-round-11 CareerState shape (progression, but no inventory).
 * Exported only for save migration (see SaveEnvelope.ts) — nothing else
 * should use this. */
export function isCareerStateShapeV5(value: unknown): value is Omit<CareerState, 'inventory'> {
  return isCareerStateShapeV4(value) && isProgressionState((value as Record<string, unknown>).progression);
}

function isInventoryState(value: unknown): value is InventoryState {
  return (
    isRecord(value) &&
    isRecord(value.ownedItemIds) &&
    Object.values(value.ownedItemIds).every((entry) => typeof entry === 'boolean')
  );
}

const HOUSING_TIERS: readonly HousingTier[] = ['room', 'apartment', 'bungalow', 'mansion'];

function isHousingState(value: unknown): value is HousingState {
  return isRecord(value) && HOUSING_TIERS.includes(value.tier as HousingTier);
}

function isActiveAssignmentState(value: unknown): value is ActiveAssignmentState {
  return isRecord(value) && typeof value.assignmentId === 'string' && typeof value.startedAtMs === 'number';
}

function isAssignmentsState(value: unknown): value is AssignmentsState {
  return isRecord(value) && (value.active === null || isActiveAssignmentState(value.active));
}

/** The pre-round-N CareerState shape (inventory, but no housing or
 * assignments). Exported only for save migration (see SaveEnvelope.ts) —
 * nothing else should use this. */
export function isCareerStateShapeV6(value: unknown): value is Omit<CareerState, 'housing' | 'assignments'> {
  return isCareerStateShapeV5(value) && isInventoryState((value as Record<string, unknown>).inventory);
}

export function isCareerStateShape(value: unknown): value is CareerState {
  return (
    isCareerStateShapeV6(value) &&
    isHousingState((value as Record<string, unknown>).housing) &&
    isAssignmentsState((value as Record<string, unknown>).assignments)
  );
}
