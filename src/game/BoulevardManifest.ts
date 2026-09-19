import { DEFAULT_FLAGS, type WorldFlagsState } from '../domain/CareerState';
import type { TimeSlot } from '../domain/TimeSystem';

/** The Boulevard scene's art layout, loaded at runtime from
 * `public/data/boulevard-manifest.json` instead of being hardcoded in
 * BoulevardSpikeScene.ts. This is what the standalone Art Director tool
 * (public/tools/art-director/index.html) reads and writes, so plane, building,
 * and prop art, positions, and the locations' signs can be tuned without a
 * code change. See docs/dev/boulevard-art-director-tool.md.
 *
 * v3 layout (art/prompts/boulevard-entrances-v3.md): the street wall is a row
 * of separately generated building modules (`buildings`) instead of one
 * stretched plane, the ground is a tiled strip, and every plane is drawn at a
 * uniform `scale` (never stretched to the world width). */

export type BoulevardPlaneId = 'sky' | 'hills' | 'distant-buildings' | 'sidewalk-street';

/** The eight street entrances plus two lot-access points that sit inside the
 * Monarch gate module until the studio-lot map exists (`extras-corral`,
 * `soundstage`). `backlot-gate` is the Monarch Pictures gate; its id is kept
 * so existing events, scene art, and saves keep working. */
export type BoulevardLocationId =
  | 'boarding-house'
  | 'costume-shop'
  | 'diner'
  | 'alley'
  | 'celestial-palace'
  | 'casting-office'
  | 'klieg-light-office'
  | 'backlot-gate'
  | 'extras-corral'
  | 'soundstage';

/** Where a plane or prop's art came from — either cropped from a shared
 * reference sheet (re-croppable later) or a standalone upload. Mirrors
 * Otaku Palace's art-manifest.json `source` shape. Absent/null means the
 * slot still has no captured art (falls back to whatever a missing texture
 * looks like in Phaser). */
export type BoulevardArtSource =
  | { readonly kind: 'sheet'; readonly sheet: string; readonly rect: readonly [number, number, number, number] }
  | { readonly kind: 'uploaded' }
  | null;

export interface BoulevardPlane {
  readonly id: BoulevardPlaneId;
  readonly label: string;
  /** Path relative to the site root (served from public/), e.g.
   * "assets/environments/boulevard-v3/sky.webp". */
  readonly path: string;
  readonly offsetX: number;
  readonly offsetY: number;
  /** Uniform draw scale (display px per texture px). Planes are never
   * stretched to the world width. */
  readonly scale: number;
  readonly scrollFactor: number;
  readonly depth: number;
  /** Tile the texture horizontally across the whole world (the ground). */
  readonly repeatX: boolean;
  readonly source: BoulevardArtSource;
}

/** When a building shows its active-state art (open, lit, gate raised):
 * true if the current time slot is one of `timeSlots`, or if the named world
 * flag is set. Both empty/null means never active. */
export interface BoulevardActiveRule {
  readonly timeSlots: readonly TimeSlot[];
  readonly flag: keyof WorldFlagsState | null;
}

/** One transparent building module of the street wall (Plane 4 in the v3
 * layout). `x` is the module's left edge in world px and `y` its bottom edge,
 * which sits a few px below the ground line so the sidewalk covers the
 * overlap. */
export interface BoulevardBuilding {
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly depth: number;
  /** Alternate texture swapped in while `activeWhen` holds; null for
   * buildings with a single state. Both fields are set together or both
   * null. */
  readonly activePath: string | null;
  readonly activeWhen: BoulevardActiveRule | null;
  readonly source: BoulevardArtSource;
}

export interface BoulevardProp {
  /** Free-form — new props can be added, so this is a generated slug, not
   * a fixed union like BoulevardPlaneId. */
  readonly id: string;
  readonly label: string;
  readonly path: string;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly flipX: boolean;
  readonly depth: number;
  readonly source: BoulevardArtSource;
}

export interface BoulevardSign {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly fontSize: number;
  readonly textColor: string;
  readonly boardColor: string;
  readonly boardWidth: number;
  readonly boardHeight: number;
  /** Draw only the text, on the blank sign panel already painted into the
   * building art (the v3 modules are drawn with blank panels). When false the
   * scene draws the original hanging board with rivets and a glow. */
  readonly textOnly: boolean;
}

export interface BoulevardLocation {
  readonly id: BoulevardLocationId;
  readonly label: string;
  readonly x: number;
  readonly promptLabel: string;
  readonly radius: number;
  /** False for entrances whose scene is not written yet: the sign still
   * shows, but there is no prompt and nothing to enter. */
  readonly enterable: boolean;
  /** Null for lot-access points and the alley, which have no sign of their own. */
  readonly sign: BoulevardSign | null;
}

export interface BoulevardManifest {
  readonly worldWidth: number;
  readonly groundY: number;
  readonly referenceSheets: readonly string[];
  readonly planes: readonly BoulevardPlane[];
  readonly buildings: readonly BoulevardBuilding[];
  readonly props: readonly BoulevardProp[];
  readonly locations: readonly BoulevardLocation[];
}

const PLANE_IDS: readonly BoulevardPlaneId[] = ['sky', 'hills', 'distant-buildings', 'sidewalk-street'];

const LOCATION_IDS: readonly BoulevardLocationId[] = [
  'boarding-house',
  'costume-shop',
  'diner',
  'alley',
  'celestial-palace',
  'casting-office',
  'klieg-light-office',
  'backlot-gate',
  'extras-corral',
  'soundstage',
];

const TIME_SLOTS: readonly TimeSlot[] = ['morning', 'afternoon', 'evening'];
const FLAG_KEYS = Object.keys(DEFAULT_FLAGS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasUniqueIds(items: readonly { readonly id: string }[]): boolean {
  return new Set(items.map((item) => item.id)).size === items.length;
}

function isArtSource(value: unknown): value is BoulevardArtSource {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  if (value.kind === 'uploaded') return true;
  if (value.kind === 'sheet') {
    return (
      typeof value.sheet === 'string' &&
      Array.isArray(value.rect) &&
      value.rect.length === 4 &&
      value.rect.every((n) => typeof n === 'number')
    );
  }
  return false;
}

function isPlane(value: unknown): value is BoulevardPlane {
  return (
    isRecord(value) &&
    PLANE_IDS.includes(value.id as BoulevardPlaneId) &&
    typeof value.label === 'string' &&
    typeof value.path === 'string' &&
    typeof value.offsetX === 'number' &&
    typeof value.offsetY === 'number' &&
    typeof value.scale === 'number' &&
    value.scale > 0 &&
    typeof value.scrollFactor === 'number' &&
    typeof value.depth === 'number' &&
    typeof value.repeatX === 'boolean' &&
    isArtSource(value.source)
  );
}

function isActiveRule(value: unknown): value is BoulevardActiveRule {
  return (
    isRecord(value) &&
    Array.isArray(value.timeSlots) &&
    value.timeSlots.every((slot) => TIME_SLOTS.includes(slot as TimeSlot)) &&
    (value.flag === null || (typeof value.flag === 'string' && FLAG_KEYS.includes(value.flag)))
  );
}

function isBuilding(value: unknown): value is BoulevardBuilding {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.label !== 'string' ||
    typeof value.path !== 'string' ||
    typeof value.x !== 'number' ||
    typeof value.y !== 'number' ||
    typeof value.scale !== 'number' ||
    !(value.scale > 0) ||
    typeof value.depth !== 'number' ||
    !isArtSource(value.source)
  ) {
    return false;
  }
  const hasPath = typeof value.activePath === 'string';
  const hasRule = value.activeWhen !== null && value.activeWhen !== undefined;
  if (value.activePath !== null && !hasPath) return false;
  if (hasPath !== hasRule) return false;
  return !hasRule || isActiveRule(value.activeWhen);
}

function isProp(value: unknown): value is BoulevardProp {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    typeof value.path === 'string' &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.scale === 'number' &&
    typeof value.flipX === 'boolean' &&
    typeof value.depth === 'number' &&
    isArtSource(value.source)
  );
}

function isSign(value: unknown): value is BoulevardSign {
  return (
    isRecord(value) &&
    typeof value.x === 'number' &&
    typeof value.y === 'number' &&
    typeof value.text === 'string' &&
    typeof value.fontSize === 'number' &&
    typeof value.textColor === 'string' &&
    typeof value.boardColor === 'string' &&
    typeof value.boardWidth === 'number' &&
    typeof value.boardHeight === 'number' &&
    typeof value.textOnly === 'boolean'
  );
}

function isLocation(value: unknown): value is BoulevardLocation {
  return (
    isRecord(value) &&
    LOCATION_IDS.includes(value.id as BoulevardLocationId) &&
    typeof value.label === 'string' &&
    typeof value.x === 'number' &&
    typeof value.promptLabel === 'string' &&
    typeof value.radius === 'number' &&
    typeof value.enterable === 'boolean' &&
    (value.sign === null || isSign(value.sign))
  );
}

/** Validates a manifest fetched from disk — the tool is a hand-editing
 * surface, so a malformed or half-saved file is a real possibility, not a
 * hypothetical. Falls back to DEFAULT_BOULEVARD_MANIFEST rather than
 * crashing the scene. */
export function isBoulevardManifest(value: unknown): value is BoulevardManifest {
  if (
    !isRecord(value) ||
    typeof value.worldWidth !== 'number' ||
    typeof value.groundY !== 'number' ||
    !Array.isArray(value.referenceSheets) ||
    !value.referenceSheets.every((s) => typeof s === 'string') ||
    !Array.isArray(value.planes) ||
    !Array.isArray(value.buildings) ||
    !Array.isArray(value.props) ||
    !Array.isArray(value.locations)
  ) {
    return false;
  }
  return (
    value.worldWidth > 0 &&
    value.planes.length === PLANE_IDS.length &&
    value.planes.every(isPlane) &&
    hasUniqueIds(value.planes as BoulevardPlane[]) &&
    value.buildings.every(isBuilding) &&
    hasUniqueIds(value.buildings as BoulevardBuilding[]) &&
    value.props.every(isProp) &&
    value.locations.length === LOCATION_IDS.length &&
    value.locations.every(isLocation) &&
    hasUniqueIds(value.locations as BoulevardLocation[])
  );
}

/** The layout BoulevardSpikeScene renders if `data/boulevard-manifest.json`
 * is missing or fails validation, so a corrupt file degrades to the known-good
 * v3 street instead of a blank scene. Keep it identical to the committed
 * JSON; tests/boulevard-manifest.test.ts enforces that. */
const DEFAULT_BOULEVARD_MANIFEST_VALUE: BoulevardManifest = {
  worldWidth: 7453,
  groundY: 1056,
  referenceSheets: ['Hollywoodland_Concept_Boulevard.png'],
  planes: [
    {
      id: 'sky',
      label: 'Plane 1 — Sky',
      path: 'assets/environments/boulevard-v3/sky.webp',
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      scrollFactor: 0,
      depth: 0,
      repeatX: false,
      source: null,
    },
    {
      id: 'hills',
      label: 'Plane 2 — Hills & landmark',
      path: 'assets/environments/boulevard-v3/hills.webp',
      offsetX: -555,
      offsetY: -78,
      scale: 1.6,
      scrollFactor: 0.18,
      depth: 1,
      repeatX: false,
      source: null,
    },
    {
      id: 'distant-buildings',
      label: 'Plane 3 — Distant buildings',
      path: 'assets/environments/boulevard-v3/distant-buildings.webp',
      offsetX: 0,
      offsetY: -51,
      scale: 1.4,
      scrollFactor: 0.42,
      depth: 2,
      repeatX: false,
      source: null,
    },
    {
      id: 'sidewalk-street',
      label: 'Plane 5 — Sidewalk & street',
      path: 'assets/environments/boulevard-v3/ground-tile.webp',
      offsetX: 0,
      offsetY: 963,
      scale: 0.666667,
      scrollFactor: 1,
      depth: 8,
      repeatX: true,
      source: null,
    },
  ],
  buildings: [
    {
      id: 'depot-canopy',
      label: 'Depot canopy',
      path: 'assets/environments/boulevard-v3/buildings/depot-canopy.webp',
      x: 120,
      y: 1003,
      scale: 0.666667,
      depth: 3,
      activePath: null,
      activeWhen: null,
      source: null,
    },
    {
      id: 'bellhaven-rooms',
      label: 'Bellhaven Rooms',
      path: 'assets/environments/boulevard-v3/buildings/bellhaven-rooms.webp',
      x: 991,
      y: 1003,
      scale: 0.666667,
      depth: 3,
      activePath: null,
      activeWhen: null,
      source: null,
    },
    {
      id: 'costume-tailor-shop',
      label: 'The Silver Thimble',
      path: 'assets/environments/boulevard-v3/buildings/costume-tailor-shop.webp',
      x: 1864,
      y: 1003,
      scale: 0.666667,
      depth: 3,
      activePath: null,
      activeWhen: null,
      source: null,
    },
    {
      id: 'gilded-spoon',
      label: 'The Gilded Spoon',
      path: 'assets/environments/boulevard-v3/buildings/gilded-spoon.webp',
      x: 2195,
      y: 1003,
      scale: 0.666667,
      depth: 3,
      activePath: 'assets/environments/boulevard-v3/buildings/gilded-spoon-active.webp',
      activeWhen: {
        timeSlots: ['morning', 'evening'],
        flag: null,
      },
      source: null,
    },
    {
      id: 'alley',
      label: 'Alley',
      path: 'assets/environments/boulevard-v3/buildings/alley.webp',
      x: 2910,
      y: 1003,
      scale: 0.666667,
      depth: 3,
      activePath: null,
      activeWhen: null,
      source: null,
    },
    {
      id: 'celestial-palace',
      label: 'The Celestial Palace',
      path: 'assets/environments/boulevard-v3/buildings/celestial-palace.webp',
      x: 3398,
      y: 1003,
      scale: 0.666667,
      depth: 3,
      activePath: 'assets/environments/boulevard-v3/buildings/celestial-palace-active.webp',
      activeWhen: {
        timeSlots: ['evening'],
        flag: null,
      },
      source: null,
    },
    {
      id: 'sunset-casting-exchange',
      label: 'Sunset Casting Exchange',
      path: 'assets/environments/boulevard-v3/buildings/sunset-casting-exchange.webp',
      x: 4569,
      y: 1003,
      scale: 0.666667,
      depth: 3,
      activePath: 'assets/environments/boulevard-v3/buildings/sunset-casting-exchange-active.webp',
      activeWhen: {
        timeSlots: ['morning', 'afternoon'],
        flag: null,
      },
      source: null,
    },
    {
      id: 'klieg-light-office',
      label: 'The Klieg Light',
      path: 'assets/environments/boulevard-v3/buildings/klieg-light-office.webp',
      x: 5489,
      y: 1003,
      scale: 0.666667,
      depth: 3,
      activePath: null,
      activeWhen: null,
      source: null,
    },
    {
      id: 'monarch-gate',
      label: 'Monarch Pictures gate',
      path: 'assets/environments/boulevard-v3/buildings/monarch-gate.webp',
      x: 6324,
      y: 1003,
      scale: 0.666667,
      depth: 3,
      activePath: 'assets/environments/boulevard-v3/buildings/monarch-gate-active.webp',
      activeWhen: {
        timeSlots: [],
        flag: 'discoveredCastingOffice',
      },
      source: null,
    },
  ],
  props: [
    {
      id: 'palm-left',
      label: 'Palm (left)',
      path: 'assets/environments/foreground/hollywood-palm-v1.png',
      x: 202,
      y: 1152,
      scale: 0.8,
      flipX: false,
      depth: 31,
      source: null,
    },
    {
      id: 'palm-right',
      label: 'Palm (right)',
      path: 'assets/environments/foreground/hollywood-palm-v1.png',
      x: 7273,
      y: 1080,
      scale: 0.9,
      flipX: true,
      depth: 31,
      source: null,
    },
    {
      id: 'streetlamp-left',
      label: 'Streetlamp (left)',
      path: 'assets/environments/foreground/hollywood-streetlamp-v1.png',
      x: 2250,
      y: 1063,
      scale: 0.74,
      flipX: false,
      depth: 14,
      source: null,
    },
    {
      id: 'streetlamp-right',
      label: 'Streetlamp (right)',
      path: 'assets/environments/foreground/hollywood-streetlamp-v1.png',
      x: 5466,
      y: 1065,
      scale: 0.74,
      flipX: true,
      depth: 14,
      source: null,
    },
    {
      id: 'sedan',
      label: 'Parked sedan',
      path: 'assets/environments/foreground/hollywood-sedan-v1.png',
      x: 1350,
      y: 1292,
      scale: 0.5,
      flipX: false,
      depth: 24,
      source: null,
    },
  ],
  locations: [
    {
      id: 'boarding-house',
      label: 'Bellhaven Rooms',
      x: 1431,
      promptLabel: 'Enter Bellhaven Rooms',
      radius: 130,
      enterable: true,
      sign: {
        x: 1432,
        y: 554,
        text: 'BELLHAVEN ROOMS',
        fontSize: 14,
        textColor: '#f3dfab',
        boardColor: '#241609',
        boardWidth: 244,
        boardHeight: 38,
        textOnly: true,
      },
    },
    {
      id: 'costume-shop',
      label: 'The Silver Thimble',
      x: 2106,
      promptLabel: 'Enter The Silver Thimble',
      radius: 100,
      enterable: true,
      sign: {
        x: 2030,
        y: 616,
        text: 'THE SILVER THIMBLE',
        fontSize: 14,
        textColor: '#f3dfab',
        boardColor: '#241609',
        boardWidth: 207,
        boardHeight: 39,
        textOnly: true,
      },
    },
    {
      id: 'diner',
      label: 'The Gilded Spoon',
      x: 2662,
      promptLabel: 'Enter The Gilded Spoon',
      radius: 130,
      enterable: true,
      sign: {
        x: 2566,
        y: 620,
        text: 'THE GILDED SPOON',
        fontSize: 20,
        textColor: '#f3dfab',
        boardColor: '#241609',
        boardWidth: 488,
        boardHeight: 37,
        textOnly: true,
      },
    },
    {
      id: 'alley',
      label: 'Alley',
      x: 3160,
      promptLabel: 'The alley',
      radius: 100,
      enterable: false,
      sign: null,
    },
    {
      id: 'celestial-palace',
      label: 'The Celestial Palace',
      x: 3984,
      promptLabel: 'Enter The Celestial Palace',
      radius: 140,
      enterable: true,
      sign: {
        x: 3984,
        y: 527,
        text: 'THE CELESTIAL\nPALACE',
        fontSize: 22,
        textColor: '#4a1510',
        boardColor: '#241609',
        boardWidth: 377,
        boardHeight: 77,
        textOnly: true,
      },
    },
    {
      id: 'casting-office',
      label: 'Sunset Casting Exchange',
      x: 5025,
      promptLabel: 'Enter Sunset Casting Exchange',
      radius: 140,
      enterable: true,
      sign: {
        x: 5029,
        y: 641,
        text: 'SUNSET CASTING\nEXCHANGE',
        fontSize: 11,
        textColor: '#3a2410',
        boardColor: '#241609',
        boardWidth: 150,
        boardHeight: 40,
        textOnly: true,
      },
    },
    {
      id: 'klieg-light-office',
      label: 'The Klieg Light',
      x: 6094,
      promptLabel: 'Enter The Klieg Light',
      radius: 110,
      enterable: true,
      sign: {
        x: 5749,
        y: 665,
        text: 'THE KLIEG LIGHT',
        fontSize: 16,
        textColor: '#3a2410',
        boardColor: '#241609',
        boardWidth: 475,
        boardHeight: 31,
        textOnly: true,
      },
    },
    {
      id: 'backlot-gate',
      label: 'Monarch Pictures gate',
      x: 6827,
      promptLabel: 'Wait at the Monarch Pictures gate',
      radius: 100,
      enterable: true,
      sign: {
        x: 6826,
        y: 548,
        text: 'MONARCH PICTURES',
        fontSize: 19,
        textColor: '#1e4a3f',
        boardColor: '#241609',
        boardWidth: 308,
        boardHeight: 85,
        textOnly: true,
      },
    },
    {
      id: 'extras-corral',
      label: 'Extras corral',
      x: 6611,
      promptLabel: 'Check in at the extras corral',
      radius: 80,
      enterable: true,
      sign: null,
    },
    {
      id: 'soundstage',
      label: 'Soundstage',
      x: 7117,
      promptLabel: 'Rehearse on the soundstage',
      radius: 90,
      enterable: true,
      sign: null,
    },
  ],
};

export const DEFAULT_BOULEVARD_MANIFEST: BoulevardManifest = Object.freeze(DEFAULT_BOULEVARD_MANIFEST_VALUE);
