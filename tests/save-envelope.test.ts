import { describe, expect, it } from 'vitest';

import { createDefaultCareerState } from '../src/domain/CareerState';
import { migrateSaveEnvelope, parseSave, SAVE_SCHEMA_VERSION, serializeSave, type SaveEnvelope } from '../src/save/SaveEnvelope';
import type { CareerState } from '../src/domain/CareerState';

const validSave: SaveEnvelope<CareerState> = {
  schemaVersion: SAVE_SCHEMA_VERSION,
  contentVersion: 'phase-2-core-systems',
  saveId: 'test-save',
  label: 'Hollywood Boulevard',
  savedAt: '2026-09-12T00:00:00.000Z',
  playtimeSeconds: 90,
  state: createDefaultCareerState(),
};

describe('save envelope', () => {
  it('round-trips valid data', () => { expect(parseSave(serializeSave(validSave))).toEqual(validSave); });

  it('rejects unsupported schemas', () => {
    expect(() => parseSave(JSON.stringify({ ...validSave, schemaVersion: 99 }))).toThrow('Unsupported save version');
  });

  it('rejects oversized imports before parsing', () => {
    expect(() => parseSave(JSON.stringify(validSave), 10)).toThrow('exceeds the permitted size');
  });

  it('migrates a legacy v1 save into the current CareerState shape', () => {
    const legacy = {
      schemaVersion: 1,
      contentVersion: 'phase-1-visual-spike',
      saveId: 'legacy-save',
      label: 'Hollywood Boulevard',
      savedAt: '2026-09-01T00:00:00.000Z',
      playtimeSeconds: 42,
      state: { playerX: 900, discoveredCastingOffice: true },
    };
    const migrated = migrateSaveEnvelope(legacy);
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.state.playerX).toBe(900);
    expect(migrated.state.flags.discoveredCastingOffice).toBe(true);
    expect(migrated.state.resources).toEqual(createDefaultCareerState().resources);
    expect(migrated.state.time).toEqual(createDefaultCareerState().time);
    expect(migrated.state.facts).toEqual({});
  });

  it('migrates a legacy v2 save (no remembered facts) into the current shape', () => {
    const { facts: _facts, ...v2State } = createDefaultCareerState();
    const legacy = {
      schemaVersion: 2,
      contentVersion: 'phase-2-core-systems',
      saveId: 'v2-save',
      label: 'Hollywood Boulevard',
      savedAt: '2026-09-14T00:00:00.000Z',
      playtimeSeconds: 10,
      state: v2State,
    };
    const migrated = migrateSaveEnvelope(legacy);
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.state.facts).toEqual({});
    expect(migrated.state.playerX).toBe(v2State.playerX);
  });

  it('round-trips a migrated v1 save after re-serializing it', () => {
    const legacy = {
      schemaVersion: 1,
      contentVersion: 'phase-1-visual-spike',
      saveId: 'legacy-save',
      label: 'Hollywood Boulevard',
      savedAt: '2026-09-01T00:00:00.000Z',
      playtimeSeconds: 42,
      state: { playerX: 900, discoveredCastingOffice: true },
    };
    const migrated = migrateSaveEnvelope(legacy);
    expect(parseSave(serializeSave(migrated))).toEqual(migrated);
  });
});
