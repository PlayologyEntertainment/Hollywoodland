import {
  createDefaultCareerState,
  DEFAULT_FACTS,
  isCareerStateShape,
  isCareerStateShapeV2,
  isCareerStateShapeV3,
  isCareerStateShapeV4,
  type CareerState,
} from '../domain/CareerState';
import { DEFAULT_PROGRESSION } from '../domain/Progression';
import { DEFAULT_RELATIONSHIPS } from '../domain/Relationships';

export const SAVE_SCHEMA_VERSION = 5;

export interface SaveEnvelope<TState = unknown> {
  readonly schemaVersion: number;
  readonly contentVersion: string;
  readonly saveId: string;
  readonly label: string;
  readonly savedAt: string;
  readonly playtimeSeconds: number;
  readonly state: TState;
}

interface LegacyV1State {
  readonly playerX: number;
  readonly discoveredCastingOffice: boolean;
}

function isLegacyV1State(value: unknown): value is LegacyV1State {
  return (
    isRecord(value) &&
    typeof value.playerX === 'number' &&
    typeof value.discoveredCastingOffice === 'boolean'
  );
}

type LegacyV2State = Omit<CareerState, 'facts' | 'relationships' | 'progression'>;
type LegacyV3State = Omit<CareerState, 'relationships' | 'progression'>;
type LegacyV4State = Omit<CareerState, 'progression'>;

function migrateV1StateToV2(legacy: LegacyV1State): LegacyV2State {
  return {
    ...createDefaultCareerState(),
    playerX: legacy.playerX,
    flags: { discoveredCastingOffice: legacy.discoveredCastingOffice },
  };
}

function migrateV2StateToV3(legacy: LegacyV2State): LegacyV3State {
  return { ...legacy, facts: DEFAULT_FACTS };
}

function migrateV3StateToV4(legacy: LegacyV3State): LegacyV4State {
  return { ...legacy, relationships: DEFAULT_RELATIONSHIPS };
}

function migrateV4StateToV5(legacy: LegacyV4State): CareerState {
  return { ...legacy, progression: DEFAULT_PROGRESSION };
}

function validateEnvelopeShell(value: unknown): asserts value is Record<string, unknown> {
  if (!isRecord(value)) throw new Error('Save file is not an object.');
  if (typeof value.contentVersion !== 'string' || value.contentVersion.length === 0) throw new Error('Save content version is missing.');
  if (typeof value.saveId !== 'string' || value.saveId.length === 0) throw new Error('Save ID is missing.');
  if (typeof value.label !== 'string' || value.label.length > 80) throw new Error('Save label is invalid.');
  if (typeof value.savedAt !== 'string' || Number.isNaN(Date.parse(value.savedAt))) throw new Error('Save timestamp is invalid.');
  if (typeof value.playtimeSeconds !== 'number' || !Number.isFinite(value.playtimeSeconds) || value.playtimeSeconds < 0) throw new Error('Save playtime is invalid.');
  if (!('state' in value)) throw new Error('Save state is missing.');
}

/** Read-side, version-tolerant path: validates the envelope shell, then
 * migrates a legacy Phase-1 (v1) state into the current CareerState shape.
 * Used by every read path — JSON import and IndexedDB load alike — so
 * existing Phase-1 saves keep working instead of being silently rejected. */
export function migrateSaveEnvelope(value: unknown): SaveEnvelope<CareerState> {
  validateEnvelopeShell(value);
  if (value.schemaVersion === SAVE_SCHEMA_VERSION) {
    if (!isCareerStateShape(value.state)) throw new Error('Save state does not match the expected shape.');
    return value as unknown as SaveEnvelope<CareerState>;
  }
  if (value.schemaVersion === 4) {
    if (!isCareerStateShapeV4(value.state)) throw new Error('Save state does not match the expected shape.');
    return {
      ...value,
      schemaVersion: SAVE_SCHEMA_VERSION,
      state: migrateV4StateToV5(value.state),
    } as unknown as SaveEnvelope<CareerState>;
  }
  if (value.schemaVersion === 3) {
    if (!isCareerStateShapeV3(value.state)) throw new Error('Save state does not match the expected shape.');
    return {
      ...value,
      schemaVersion: SAVE_SCHEMA_VERSION,
      state: migrateV4StateToV5(migrateV3StateToV4(value.state)),
    } as unknown as SaveEnvelope<CareerState>;
  }
  if (value.schemaVersion === 2) {
    if (!isCareerStateShapeV2(value.state)) throw new Error('Save state does not match the expected shape.');
    return {
      ...value,
      schemaVersion: SAVE_SCHEMA_VERSION,
      state: migrateV4StateToV5(migrateV3StateToV4(migrateV2StateToV3(value.state))),
    } as unknown as SaveEnvelope<CareerState>;
  }
  if (value.schemaVersion === 1) {
    if (!isLegacyV1State(value.state)) throw new Error('Save state does not match the expected shape.');
    return {
      ...value,
      schemaVersion: SAVE_SCHEMA_VERSION,
      state: migrateV4StateToV5(migrateV3StateToV4(migrateV2StateToV3(migrateV1StateToV2(value.state)))),
    } as unknown as SaveEnvelope<CareerState>;
  }
  throw new Error('Unsupported save version.');
}

export function serializeSave(envelope: SaveEnvelope<CareerState>): string {
  validateSaveEnvelope(envelope);
  return JSON.stringify(envelope, null, 2);
}

export function parseSave(raw: string, maximumBytes = 2_000_000): SaveEnvelope<CareerState> {
  if (new TextEncoder().encode(raw).byteLength > maximumBytes) {
    throw new Error('Save file exceeds the permitted size.');
  }
  const value: unknown = JSON.parse(raw);
  return migrateSaveEnvelope(value);
}

/** Write-side guard: only ever accepts a fully current, valid envelope —
 * migration tolerance belongs to the read side (migrateSaveEnvelope/parseSave). */
export function validateSaveEnvelope(value: unknown): asserts value is SaveEnvelope<CareerState> {
  validateEnvelopeShell(value);
  if (value.schemaVersion !== SAVE_SCHEMA_VERSION) throw new Error('Unsupported save version.');
  if (!isCareerStateShape(value.state)) throw new Error('Save state does not match the expected shape.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
