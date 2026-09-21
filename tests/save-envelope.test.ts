import { describe, expect, it } from 'vitest';

import { createDefaultCareerState } from '../src/domain/CareerState';
import { AUTOSAVE_ID, MANUAL_SAVE_ID, migrateSaveEnvelope, newestSave, parseSave, SAVE_SCHEMA_VERSION, serializeSave, type SaveEnvelope } from '../src/save/SaveEnvelope';
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

describe('newestSave', () => {
  const at = (saveId: string, savedAt: string): SaveEnvelope<CareerState> => ({ ...validSave, saveId, savedAt });

  it('gives the autosave when it is newer than the manual save, and the manual save when it is newer', () => {
    const manual = at(MANUAL_SAVE_ID, '2026-09-20T10:00:00.000Z');
    const autosave = at(AUTOSAVE_ID, '2026-09-21T10:00:00.000Z');
    expect(newestSave([manual, autosave])).toBe(autosave);
    expect(newestSave([autosave, at(MANUAL_SAVE_ID, '2026-09-22T10:00:00.000Z')])?.saveId).toBe(MANUAL_SAVE_ID);
  });

  it('uses whichever save exists when the other slot is empty', () => {
    const autosave = at(AUTOSAVE_ID, '2026-09-21T10:00:00.000Z');
    expect(newestSave([undefined, autosave])).toBe(autosave);
    expect(newestSave([autosave, undefined])).toBe(autosave);
  });

  it('gives nothing when there are no saves, so Continue stays off', () => {
    expect(newestSave([undefined, undefined])).toBeUndefined();
    expect(newestSave([])).toBeUndefined();
  });

  it('treats an unreadable date as the oldest', () => {
    const broken = at(MANUAL_SAVE_ID, 'not a date');
    const autosave = at(AUTOSAVE_ID, '2026-09-21T10:00:00.000Z');
    expect(newestSave([broken, autosave])).toBe(autosave);
    expect(newestSave([autosave, broken])).toBe(autosave);
  });

  it('keeps the two slots distinct', () => {
    expect(AUTOSAVE_ID).not.toBe(MANUAL_SAVE_ID);
  });
});

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
    const { facts: _facts, relationships: _relationships, progression: _progression, inventory: _inventory, ...v2State } = createDefaultCareerState();
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
    expect(migrated.state.relationships).toEqual({});
    expect(migrated.state.playerX).toBe(v2State.playerX);
  });

  it('migrates a legacy v3 save (no relationship meters) into the current shape', () => {
    const { relationships: _relationships, progression: _progression, inventory: _inventory, ...v3State } = createDefaultCareerState();
    const legacy = {
      schemaVersion: 3,
      contentVersion: 'phase-2-core-systems',
      saveId: 'v3-save',
      label: 'Hollywood Boulevard',
      savedAt: '2026-09-15T00:00:00.000Z',
      playtimeSeconds: 20,
      state: v3State,
    };
    const migrated = migrateSaveEnvelope(legacy);
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.state.relationships).toEqual({});
    expect(migrated.state.progression).toEqual(createDefaultCareerState().progression);
    expect(migrated.state.playerX).toBe(v3State.playerX);
  });

  it('migrates a legacy v4 save (no progression) into the current shape', () => {
    const { progression: _progression, inventory: _inventory, ...v4State } = createDefaultCareerState();
    const legacy = {
      schemaVersion: 4,
      contentVersion: 'phase-2-core-systems',
      saveId: 'v4-save',
      label: 'Hollywood Boulevard',
      savedAt: '2026-09-15T00:00:00.000Z',
      playtimeSeconds: 30,
      state: v4State,
    };
    const migrated = migrateSaveEnvelope(legacy);
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.state.progression).toEqual(createDefaultCareerState().progression);
    expect(migrated.state.inventory).toEqual(createDefaultCareerState().inventory);
    expect(migrated.state.playerX).toBe(v4State.playerX);
  });

  it('migrates a legacy v5 save (no inventory) into the current shape', () => {
    const { inventory: _inventory, ...v5State } = createDefaultCareerState();
    const legacy = {
      schemaVersion: 5,
      contentVersion: 'phase-2-core-systems',
      saveId: 'v5-save',
      label: 'Hollywood Boulevard',
      savedAt: '2026-09-15T00:00:00.000Z',
      playtimeSeconds: 40,
      state: v5State,
    };
    const migrated = migrateSaveEnvelope(legacy);
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.state.inventory).toEqual(createDefaultCareerState().inventory);
    expect(migrated.state.playerX).toBe(v5State.playerX);
  });

  it('migrates a legacy v6 save (no housing or assignments) into the current shape', () => {
    const { housing: _housing, assignments: _assignments, ...v6State } = createDefaultCareerState();
    const legacy = {
      schemaVersion: 6,
      contentVersion: 'phase-2-core-systems',
      saveId: 'v6-save',
      label: 'Hollywood Boulevard',
      savedAt: '2026-09-16T00:00:00.000Z',
      playtimeSeconds: 50,
      state: v6State,
    };
    const migrated = migrateSaveEnvelope(legacy);
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.state.housing).toEqual(createDefaultCareerState().housing);
    expect(migrated.state.assignments).toEqual(createDefaultCareerState().assignments);
    expect(migrated.state.playerX).toBe(v6State.playerX);
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
