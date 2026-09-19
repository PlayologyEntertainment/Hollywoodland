// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { DEFAULT_FLAGS } from '../src/domain/CareerState';
import type { TimeSlot } from '../src/domain/TimeSystem';
import {
  DEFAULT_BOULEVARD_MANIFEST,
  isBoulevardManifest,
  type BoulevardBuilding,
  type BoulevardManifest,
} from '../src/game/BoulevardManifest';
import { isBuildingActive, nearestInteractable } from '../src/game/BoulevardStates';

const publicFile = (path: string): URL => new URL(`../public/${path}`, import.meta.url);
const committed = JSON.parse(readFileSync(publicFile('data/boulevard-manifest.json'), 'utf8')) as BoulevardManifest;

/** The parts of Node's Buffer that webpSize reads (the import above is untyped). */
interface NodeBuffer {
  toString(encoding: 'ascii', start: number, end: number): string;
  readUIntLE(offset: number, length: number): number;
  readUInt16LE(offset: number): number;
  readUInt32LE(offset: number): number;
}

/** Width and height of a WebP without an image library: the three container
 * layouts (lossy 'VP8 ', extended 'VP8X', lossless 'VP8L') each store the
 * canvas size in a different place. */
function webpSize(path: string): { width: number; height: number } {
  const b: NodeBuffer = readFileSync(publicFile(path));
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`${path} is not a WebP`);
  }
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (kind === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  throw new Error(`${path}: unknown WebP chunk ${kind}`);
}

const buildingWidth = (b: BoulevardBuilding): number => webpSize(b.path).width * b.scale;
const buildingHeight = (b: BoulevardBuilding): number => webpSize(b.path).height * b.scale;

const CAMERA_WIDTH = 1920;
const CAMERA_HEIGHT = 1080;
const OVERLAP = 40; // hidden display px under the ground line

describe('committed Boulevard manifest', () => {
  it('passes the runtime validator', () => {
    expect(isBoulevardManifest(committed)).toBe(true);
  });

  it('is identical to the built-in fallback default', () => {
    expect(DEFAULT_BOULEVARD_MANIFEST).toEqual(committed);
  });

  it('only references images that exist', () => {
    const paths = [
      ...committed.planes.map((p) => p.path),
      ...committed.buildings.map((b) => b.path),
      ...committed.buildings.flatMap((b) => (b.activePath === null ? [] : [b.activePath])),
      ...committed.props.map((p) => p.path),
    ];
    const missing = paths.filter((path) => !existsSync(publicFile(path)));
    expect(missing).toEqual([]);
  });

  it('lays the buildings out left to right without overlaps or gaps', () => {
    const buildings = [...committed.buildings].sort((a, b) => a.x - b.x);
    for (let i = 1; i < buildings.length; i += 1) {
      const previous = buildings[i - 1];
      const current = buildings[i];
      if (previous === undefined || current === undefined) throw new Error('unreachable');
      const gap = current.x - (previous.x + buildingWidth(previous));
      expect(Math.abs(gap), `${previous.id} to ${current.id}`).toBeLessThanOrEqual(2);
    }
    const last = buildings[buildings.length - 1];
    if (last === undefined) throw new Error('no buildings');
    expect(last.x + buildingWidth(last)).toBeLessThanOrEqual(committed.worldWidth);
  });

  it('stands every building on the same ground line, under the sidewalk overlap', () => {
    const ground = committed.planes.find((p) => p.id === 'sidewalk-street');
    expect(ground).toBeDefined();
    for (const building of committed.buildings) {
      expect(building.y - OVERLAP, building.id).toBe(ground?.offsetY);
    }
  });

  it('keeps every active-state texture the same size as its base texture', () => {
    for (const building of committed.buildings) {
      if (building.activePath === null) continue;
      expect(webpSize(building.activePath), building.id).toEqual(webpSize(building.path));
    }
  });

  it('draws the sky, hills and distant buildings so they cover the camera at every scroll position', () => {
    const maxCameraX = committed.worldWidth - CAMERA_WIDTH;
    for (const plane of committed.planes) {
      if (plane.repeatX) continue;
      const size = webpSize(plane.path);
      const width = size.width * plane.scale;
      const height = size.height * plane.scale;
      // Left edge is furthest right at camera x = 0; right edge is furthest left at the last camera x.
      expect(plane.offsetX, `${plane.id} left edge`).toBeLessThanOrEqual(0);
      const rightEdgeAtEnd = plane.offsetX + width - plane.scrollFactor * maxCameraX;
      expect(rightEdgeAtEnd, `${plane.id} right edge at the end of the street`).toBeGreaterThanOrEqual(CAMERA_WIDTH);
      // Nothing may end above the bottom of the screen where it should reach the ground.
      if (plane.id !== 'sky') {
        expect(plane.offsetY + height, `${plane.id} bottom`).toBeGreaterThanOrEqual(CAMERA_HEIGHT - 120);
      }
    }
    const sky = committed.planes.find((p) => p.id === 'sky');
    const skySize = webpSize(sky?.path ?? '');
    expect(skySize.width * (sky?.scale ?? 0)).toBeGreaterThanOrEqual(CAMERA_WIDTH);
    expect(skySize.height * (sky?.scale ?? 0)).toBeGreaterThanOrEqual(CAMERA_HEIGHT);
  });

  it('keeps the whole-world ground tile wide enough to repeat cleanly', () => {
    const ground = committed.planes.find((p) => p.repeatX);
    expect(ground).toBeDefined();
    const tileWidth = webpSize(ground?.path ?? '').width * (ground?.scale ?? 0);
    expect(tileWidth).toBeGreaterThan(CAMERA_WIDTH);
  });

  it('puts every location, and every sign, on the building it belongs to', () => {
    const boxes = committed.buildings.map((b) => ({
      id: b.id,
      left: b.x,
      right: b.x + buildingWidth(b),
      top: b.y - buildingHeight(b),
      bottom: b.y,
    }));
    for (const location of committed.locations) {
      expect(location.x, `${location.id} on the street`).toBeGreaterThanOrEqual(boxes[0]?.left ?? 0);
      const onABuilding = boxes.some((box) => location.x >= box.left && location.x <= box.right);
      expect(onABuilding, `${location.id} stands at a building`).toBe(true);
      if (location.sign !== null) {
        const sign = location.sign;
        const onPanel = boxes.some(
          (box) => sign.x >= box.left && sign.x <= box.right && sign.y >= box.top && sign.y <= box.bottom,
        );
        expect(onPanel, `${location.id} sign sits on a building`).toBe(true);
      }
    }
  });

  it('signs the sound stage but not the corral, and gives the not-yet-written entrance no interaction', () => {
    const byId = new Map(committed.locations.map((l) => [l.id, l]));
    expect(byId.get('extras-corral')?.sign).toBeNull();
    expect(byId.get('soundstage')?.sign?.text).toBe('SOUND STAGE');
    expect(byId.get('alley')?.enterable, 'alley').toBe(false);
    for (const id of ['boarding-house', 'costume-shop', 'diner', 'celestial-palace', 'casting-office', 'klieg-light-office', 'backlot-gate', 'extras-corral', 'soundstage'] as const) {
      expect(byId.get(id)?.enterable, id).toBe(true);
    }
  });

  it('uses the approved canon names on the signs', () => {
    const text = committed.locations.flatMap((l) => (l.sign === null ? [] : [l.sign.text.replace(/\n/g, ' ')]));
    expect(text).toEqual(
      expect.arrayContaining([
        'BELLHAVEN ROOMS',
        'THE SILVER THIMBLE',
        'THE GILDED SPOON',
        'THE CELESTIAL PALACE',
        'SUNSET CASTING EXCHANGE',
        'THE KLIEG LIGHT',
        'MONARCH PICTURES',
      ]),
    );
    expect(text.join(' ')).not.toMatch(/SUNSET DINER|BOARDING HOUSE|BACKLOT/);
  });

  it('binds the four stateful buildings to the agreed rules', () => {
    const rule = (id: string) => committed.buildings.find((b) => b.id === id)?.activeWhen;
    expect(rule('gilded-spoon')).toEqual({ timeSlots: ['morning', 'evening'], flag: null });
    expect(rule('celestial-palace')).toEqual({ timeSlots: ['evening'], flag: null });
    expect(rule('sunset-casting-exchange')).toEqual({ timeSlots: ['morning', 'afternoon'], flag: null });
    expect(rule('monarch-gate')).toEqual({ timeSlots: [], flag: 'discoveredCastingOffice' });
    const stateful = committed.buildings.filter((b) => b.activeWhen !== null).map((b) => b.id);
    expect(stateful.sort()).toEqual(['celestial-palace', 'gilded-spoon', 'monarch-gate', 'sunset-casting-exchange']);
  });
});

describe('isBoulevardManifest', () => {
  const clone = (): Record<string, unknown> => structuredClone(committed) as unknown as Record<string, unknown>;

  it('rejects a manifest missing the buildings list (the old v2 shape)', () => {
    const value = clone();
    delete value.buildings;
    expect(isBoulevardManifest(value)).toBe(false);
  });

  it('rejects the old five-plane layout', () => {
    const value = clone();
    (value.planes as unknown[]).push((value.planes as unknown[])[0]);
    expect(isBoulevardManifest(value)).toBe(false);
  });

  it('rejects planes without a uniform scale (the old stretched planes)', () => {
    const value = clone();
    delete ((value.planes as Record<string, unknown>[])[0] as Record<string, unknown>).scale;
    expect(isBoulevardManifest(value)).toBe(false);
  });

  it('rejects a non-positive scale', () => {
    const value = clone();
    ((value.buildings as Record<string, unknown>[])[0] as Record<string, unknown>).scale = 0;
    expect(isBoulevardManifest(value)).toBe(false);
  });

  it('rejects duplicate building ids', () => {
    const value = clone();
    const buildings = value.buildings as Record<string, unknown>[];
    (buildings[1] as Record<string, unknown>).id = (buildings[0] as Record<string, unknown>).id;
    expect(isBoulevardManifest(value)).toBe(false);
  });

  it('rejects a location list that is not exactly the ten known locations', () => {
    const value = clone();
    (value.locations as unknown[]).pop();
    expect(isBoulevardManifest(value)).toBe(false);
  });

  it('rejects an active texture without a rule, and a rule without a texture', () => {
    const noRule = clone();
    const spoon = (noRule.buildings as Record<string, unknown>[]).find((b) => b.id === 'gilded-spoon');
    if (spoon === undefined) throw new Error('fixture: gilded-spoon');
    spoon.activeWhen = null;
    expect(isBoulevardManifest(noRule)).toBe(false);

    const noTexture = clone();
    const depot = (noTexture.buildings as Record<string, unknown>[]).find((b) => b.id === 'depot-canopy');
    if (depot === undefined) throw new Error('fixture: depot-canopy');
    depot.activeWhen = { timeSlots: ['evening'], flag: null };
    expect(isBoulevardManifest(noTexture)).toBe(false);
  });

  it('rejects a rule naming an unknown time slot or world flag', () => {
    const badSlot = clone();
    const spoon = (badSlot.buildings as Record<string, unknown>[]).find((b) => b.id === 'gilded-spoon');
    if (spoon === undefined) throw new Error('fixture: gilded-spoon');
    spoon.activeWhen = { timeSlots: ['midnight'], flag: null };
    expect(isBoulevardManifest(badSlot)).toBe(false);

    const badFlag = clone();
    const gate = (badFlag.buildings as Record<string, unknown>[]).find((b) => b.id === 'monarch-gate');
    if (gate === undefined) throw new Error('fixture: monarch-gate');
    gate.activeWhen = { timeSlots: [], flag: 'notARealFlag' };
    expect(isBoulevardManifest(badFlag)).toBe(false);
  });

  it('accepts a null sign but rejects a malformed one', () => {
    const value = clone();
    const alley = (value.locations as Record<string, unknown>[]).find((l) => l.id === 'alley');
    if (alley === undefined) throw new Error('fixture: alley');
    expect(alley.sign).toBeNull();
    expect(isBoulevardManifest(value)).toBe(true);
    alley.sign = 'nope';
    expect(isBoulevardManifest(value)).toBe(false);
  });

  it('rejects things that are not objects', () => {
    for (const value of [null, undefined, 5, 'x', [], {}]) {
      expect(isBoulevardManifest(value)).toBe(false);
    }
  });
});

describe('isBuildingActive', () => {
  const stateFor = (slot: TimeSlot, discovered = false) => ({
    time: { day: 1, slot },
    flags: { ...DEFAULT_FLAGS, discoveredCastingOffice: discovered },
  });

  it('is never active without a rule', () => {
    expect(isBuildingActive(null, stateFor('morning', true))).toBe(false);
  });

  it('follows the listed time slots', () => {
    const rule = { timeSlots: ['morning', 'evening'] as TimeSlot[], flag: null };
    expect(isBuildingActive(rule, stateFor('morning'))).toBe(true);
    expect(isBuildingActive(rule, stateFor('afternoon'))).toBe(false);
    expect(isBuildingActive(rule, stateFor('evening'))).toBe(true);
  });

  it('follows a world flag regardless of the time slot', () => {
    const rule = { timeSlots: [], flag: 'discoveredCastingOffice' as const };
    expect(isBuildingActive(rule, stateFor('morning'))).toBe(false);
    expect(isBuildingActive(rule, stateFor('morning', true))).toBe(true);
    expect(isBuildingActive(rule, stateFor('evening', true))).toBe(true);
  });

  it('is active when either the slot or the flag matches', () => {
    const rule = { timeSlots: ['evening'] as TimeSlot[], flag: 'discoveredCastingOffice' as const };
    expect(isBuildingActive(rule, stateFor('afternoon'))).toBe(false);
    expect(isBuildingActive(rule, stateFor('evening'))).toBe(true);
    expect(isBuildingActive(rule, stateFor('afternoon', true))).toBe(true);
  });

  it('does not mutate the state it reads', () => {
    const state = stateFor('evening');
    const before = JSON.stringify(state);
    isBuildingActive({ timeSlots: ['evening'], flag: null }, state);
    expect(JSON.stringify(state)).toBe(before);
  });
});

describe('nearestInteractable', () => {
  const points = [
    { id: 'a', x: 100, radius: 150 },
    { id: 'b', x: 220, radius: 150 },
    { id: 'c', x: 900, radius: 50 },
  ];

  it('returns nothing when the player is out of range of everything', () => {
    expect(nearestInteractable(points, 600)).toBeUndefined();
    expect(nearestInteractable([], 100)).toBeUndefined();
  });

  it('returns the only point in range', () => {
    expect(nearestInteractable(points, 880)?.id).toBe('c');
  });

  it('prefers the nearer of two overlapping points, not the first in the list', () => {
    expect(nearestInteractable(points, 190)?.id).toBe('b');
    expect(nearestInteractable(points, 130)?.id).toBe('a');
  });

  it('treats the radius as exclusive', () => {
    expect(nearestInteractable([{ id: 'r', x: 0, radius: 100 }], 100)).toBeUndefined();
    expect(nearestInteractable([{ id: 'r', x: 0, radius: 100 }], 99)?.id).toBe('r');
  });

  it('keeps the earlier point on an exact tie', () => {
    const tie = [
      { id: 'first', x: 0, radius: 100 },
      { id: 'second', x: 100, radius: 100 },
    ];
    expect(nearestInteractable(tie, 50)?.id).toBe('first');
  });
});
