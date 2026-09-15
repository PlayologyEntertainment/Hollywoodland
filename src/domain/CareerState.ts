import { DEFAULT_ATTRIBUTES, type AttributesState } from './Origins';
import { DEFAULT_RESOURCES, type ResourcesState } from './EconomySystem';
import { DEFAULT_TIME, type TimeState } from './TimeSystem';

export interface IdentityState {
  readonly name: string;
  readonly originId: string;
  readonly skinToneIndex: number;
  readonly appearance: Readonly<Record<string, number>>;
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
  /** Open-ended, content-keyed facts remembered by dialogue (and, later,
   * quest/relationship content) — distinct from the fixed-key WorldFlagsState. */
  readonly facts: Readonly<Record<string, boolean>>;

  // Extension points for future Phase 2 rounds — intentionally unpopulated
  // until those systems are designed:
  // readonly relationships: RelationshipState; // per-NPC relationship meters
  // readonly inventory: InventoryState;         // items, wardrobe, rewards
  // readonly progression: ProgressionState;     // XP, talents, levels, credits
  //
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
    isRecord(value.appearance)
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

/** The pre-round-2 CareerState shape (no remembered facts). Exported only
 * for save migration (see SaveEnvelope.ts) — nothing else should use this. */
export function isCareerStateShapeV2(value: unknown): value is Omit<CareerState, 'facts'> {
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

export function isCareerStateShape(value: unknown): value is CareerState {
  return isCareerStateShapeV2(value) && isFactsState((value as Record<string, unknown>).facts);
}
