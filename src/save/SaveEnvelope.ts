export const SAVE_SCHEMA_VERSION = 1;

export interface SaveEnvelope<TState = unknown> {
  readonly schemaVersion: number;
  readonly contentVersion: string;
  readonly saveId: string;
  readonly label: string;
  readonly savedAt: string;
  readonly playtimeSeconds: number;
  readonly state: TState;
}

export function serializeSave(envelope: SaveEnvelope): string {
  validateSaveEnvelope(envelope);
  return JSON.stringify(envelope, null, 2);
}

export function parseSave(raw: string, maximumBytes = 2_000_000): SaveEnvelope {
  if (new TextEncoder().encode(raw).byteLength > maximumBytes) {
    throw new Error('Save file exceeds the permitted size.');
  }
  const value: unknown = JSON.parse(raw);
  validateSaveEnvelope(value);
  return value;
}

export function validateSaveEnvelope(value: unknown): asserts value is SaveEnvelope {
  if (!isRecord(value)) throw new Error('Save file is not an object.');
  if (value.schemaVersion !== SAVE_SCHEMA_VERSION) throw new Error('Unsupported save version.');
  if (typeof value.contentVersion !== 'string' || value.contentVersion.length === 0) throw new Error('Save content version is missing.');
  if (typeof value.saveId !== 'string' || value.saveId.length === 0) throw new Error('Save ID is missing.');
  if (typeof value.label !== 'string' || value.label.length > 80) throw new Error('Save label is invalid.');
  if (typeof value.savedAt !== 'string' || Number.isNaN(Date.parse(value.savedAt))) throw new Error('Save timestamp is invalid.');
  if (typeof value.playtimeSeconds !== 'number' || !Number.isFinite(value.playtimeSeconds) || value.playtimeSeconds < 0) throw new Error('Save playtime is invalid.');
  if (!('state' in value)) throw new Error('Save state is missing.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
