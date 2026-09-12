import { describe, expect, it } from 'vitest';

import { parseSave, SAVE_SCHEMA_VERSION, serializeSave, type SaveEnvelope } from '../src/save/SaveEnvelope';

const validSave: SaveEnvelope = {
  schemaVersion: SAVE_SCHEMA_VERSION,
  contentVersion: 'phase-1-visual-spike',
  saveId: 'test-save',
  label: 'Hollywood Boulevard',
  savedAt: '2026-09-12T00:00:00.000Z',
  playtimeSeconds: 90,
  state: { playerX: 620, discoveredCastingOffice: false },
};

describe('save envelope', () => {
  it('round-trips valid data', () => { expect(parseSave(serializeSave(validSave))).toEqual(validSave); });
  it('rejects unsupported schemas', () => {
    expect(() => parseSave(JSON.stringify({ ...validSave, schemaVersion: 99 }))).toThrow('Unsupported save version');
  });
  it('rejects oversized imports before parsing', () => {
    expect(() => parseSave(JSON.stringify(validSave), 10)).toThrow('exceeds the permitted size');
  });
});
