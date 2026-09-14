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

export interface CareerState {
  readonly playerX: number;
  readonly identity: IdentityState;
  readonly attributes: AttributesState;
  readonly time: TimeState;
  readonly resources: ResourcesState;
  readonly flags: WorldFlagsState;

  // Extension points for future Phase 2 rounds — intentionally unpopulated
  // until those systems are designed:
  // readonly quests: QuestState;               // quest graph progress/flags
  // readonly relationships: RelationshipState; // per-NPC relationship meters and remembered facts
  // readonly inventory: InventoryState;         // items, wardrobe, rewards
  // readonly progression: ProgressionState;     // XP, talents, levels, credits
}

export function createInitialCareerState(identity: IdentityState, attributes: AttributesState): CareerState {
  return {
    playerX: DEFAULT_PLAYER_X,
    identity,
    attributes,
    time: DEFAULT_TIME,
    resources: DEFAULT_RESOURCES,
    flags: DEFAULT_FLAGS,
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

export function isCareerStateShape(value: unknown): value is CareerState {
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
