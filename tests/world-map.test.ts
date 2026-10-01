// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { visualStateFor } from '../src/app/BusMap';
import { REGIONS } from '../src/domain/Travel';
import { DEFAULT_BOULEVARD_MANIFEST } from '../src/game/BoulevardManifest';
import { MAP_REGIONS, regionOutline, WORLD_MAP_IMAGE, WORLD_MAP_SIZE, type MapPoint } from '../src/game/WorldMap';

const read = (path: string): string => (readFileSync(new URL(path, import.meta.url), 'utf8') as string).replace(/\r\n/g, '\n');

function inside(point: MapPoint, polygon: readonly MapPoint[]): boolean {
  const [x, y] = point;
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, yi] = polygon[i] as MapPoint;
    const [xj, yj] = polygon[j] as MapPoint;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) result = !result;
  }
  return result;
}

describe('the map regions', () => {
  it('are one outline for each region, in the picture\'s own pixels', () => {
    expect(MAP_REGIONS.map((region) => region.id).sort()).toEqual(REGIONS.map((region) => region.id).sort());
    for (const region of MAP_REGIONS) {
      expect(region.points.length, region.id).toBeGreaterThanOrEqual(4);
      for (const [x, y] of region.points) {
        expect(x, region.id).toBeGreaterThanOrEqual(0);
        expect(x, region.id).toBeLessThanOrEqual(WORLD_MAP_SIZE.width);
        expect(y, region.id).toBeGreaterThanOrEqual(0);
        expect(y, region.id).toBeLessThanOrEqual(WORLD_MAP_SIZE.height);
      }
      expect(regionOutline(region), region.id).toMatch(/^\d+,\d+( \d+,\d+)+$/);
    }
  });

  it('put each name tag inside its own region', () => {
    for (const region of MAP_REGIONS) expect(inside(region.label, region.points), region.id).toBe(true);
  });

  it('tile the whole picture: every spot belongs to exactly one region, give or take the width of an edge', () => {
    let uncovered = 0;
    let overlapped = 0;
    let total = 0;
    for (let y = 7; y < WORLD_MAP_SIZE.height; y += 13) {
      for (let x = 5; x < WORLD_MAP_SIZE.width; x += 13) {
        total += 1;
        const hits = MAP_REGIONS.filter((region) => inside([x, y], region.points)).length;
        if (hits === 0) uncovered += 1;
        if (hits > 1) overlapped += 1;
      }
    }
    expect(uncovered / total).toBeLessThan(0.003);
    expect(overlapped / total).toBeLessThan(0.003);
  });

  it('light the player\'s own region, dim the rest, and explain a region that cannot be reached', () => {
    expect(visualStateFor('here')).toBe('here');
    expect(visualStateFor('ready')).toBe('ready');
    expect(visualStateFor('cannot-afford')).toBe('poor');
    expect(visualStateFor('coming-soon')).toBe('locked');
  });
});

describe('the map art', () => {
  it('is a 1536 x 1024 webp in the game\'s UI assets, matching the size the regions are drawn for', () => {
    expect(WORLD_MAP_IMAGE).toBe('assets/ui/hollywoodland-map.webp');
    const bytes = readFileSync(new URL('../public/assets/ui/hollywoodland-map.webp', import.meta.url)) as unknown as Uint8Array;
    const text = (from: number, to: number): string => String.fromCharCode(...bytes.slice(from, to));
    expect(text(0, 4)).toBe('RIFF');
    expect(text(8, 12)).toBe('WEBP');
    expect(text(12, 16)).toBe('VP8 ');
    const width = ((bytes[26] as number) | ((bytes[27] as number) << 8)) & 0x3fff;
    const height = ((bytes[28] as number) | ((bytes[29] as number) << 8)) & 0x3fff;
    expect({ width, height }).toEqual(WORLD_MAP_SIZE);
  });
});

describe('the Union Bus Depot entrance', () => {
  const depot = DEFAULT_BOULEVARD_MANIFEST.locations.find((location) => location.id === 'bus-depot');
  const building = DEFAULT_BOULEVARD_MANIFEST.buildings.find((candidate) => candidate.id === 'depot-canopy');

  it('is the left-most entrance, open to enter, and lands inside the depot canopy it belongs to', () => {
    expect(depot).toBeDefined();
    expect(depot?.enterable).toBe(true);
    expect(depot?.promptLabel).toBe('Board the bus');
    expect(DEFAULT_BOULEVARD_MANIFEST.locations[0]?.id).toBe('bus-depot');
    const left = building?.x ?? 0;
    const right = left + 1306 * (building?.scale ?? 0);
    expect(depot?.x ?? 0).toBeGreaterThan(left);
    expect(depot?.x ?? 0).toBeLessThan(right);
    expect(Math.min(...DEFAULT_BOULEVARD_MANIFEST.locations.filter((l) => l.id !== 'bus-depot').map((l) => l.x))).toBeGreaterThan(depot?.x ?? 0);
  });

  it('carries the header sign and a wall plaque, both lettered in code on the building\'s blank panels', () => {
    expect(depot?.sign?.text).toBe('UNION BUS DEPOT');
    expect(depot?.sign?.textOnly).toBe(true);
    expect(depot?.extraSigns).toHaveLength(1);
    expect(depot?.extraSigns?.[0]?.text).toBe('TO ALL\nPOINTS');
    expect(depot?.extraSigns?.[0]?.textOnly).toBe(true);
  });

  it('opens the map: the scene reports the entrance, and the shell shows the map and switches gameplay keys off while it is open', () => {
    const scene = read('../src/game/scenes/BoulevardSpikeScene.ts');
    const shell = read('../src/app/AppShell.ts');
    const busMap = read('../src/app/BusMap.ts');
    expect(scene).toMatch(/case 'bus-depot':\s*this\.domainEvents\.emit\('bus-depot-entered'/);
    expect(shell).toContain("on('bus-depot-entered', () => {\n      this.busMap.open();");
    expect(busMap).toContain('this.options.setGameplayActive(false);');
    expect(busMap).toContain("addEventListener('close', () => options.setGameplayActive(true))");
  });
});

describe('the map screen and the welcome sign in index.html', () => {
  const html = read('../index.html');

  it('has the map dialog with a stage the regions are drawn into, an info line and a Close button', () => {
    const dialog = html.match(/<dialog id="bus-map-dialog"[\s\S]*?<\/dialog>/)?.[0] ?? '';
    for (const id of ['bus-map-title', 'bus-map-close', 'bus-map-stage', 'bus-map-info']) expect(dialog, id).toContain(`id="${id}"`);
    expect(dialog).toContain('data-i18n="busMap.title"');
    expect(dialog).toContain('role="status"');
  });

  it('has the classic welcome sign: welcome line, city, subtitle, population and a hint, all filled in by the shell', () => {
    const sign = html.match(/<section id="welcome-sign"[\s\S]*?<\/section>/)?.[0] ?? '';
    for (const id of ['welcome-city', 'welcome-subtitle', 'welcome-population', 'welcome-hint']) expect(sign, id).toContain(`id="${id}"`);
    expect(sign).toContain('data-i18n="welcomeSign.welcomeTo"');
    expect(sign).toContain('hidden');
  });

  it('keeps the full-screen welcome sign switched off for now', () => {
    const shell = read('../src/app/AppShell.ts');
    expect(shell).not.toContain('WelcomeSign');
    expect(shell).not.toContain('welcomeSign');
  });
});
