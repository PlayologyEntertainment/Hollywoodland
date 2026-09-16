/** The Boulevard scene's art layout, loaded at runtime from
 * `public/data/boulevard-manifest.json` instead of being hardcoded in
 * BoulevardSpikeScene.ts. This is what the standalone Art Director tool
 * (public/tools/art-director/index.html) reads and writes, so plane/prop
 * art, positions, and the five locations' signs can be tuned without a
 * code change. See docs/dev/boulevard-art-director-tool.md. */

export type BoulevardPlaneId = 'sky' | 'hills' | 'distant-buildings' | 'main-architecture' | 'sidewalk-street';

export type BoulevardLocationId =
  | 'boarding-house'
  | 'casting-office'
  | 'diner'
  | 'backlot-gate'
  | 'extras-corral';

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
   * "assets/environments/boulevard-v2/01-sky.png". */
  readonly path: string;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly scrollFactor: number;
  readonly depth: number;
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
}

export interface BoulevardLocation {
  readonly id: BoulevardLocationId;
  readonly label: string;
  readonly x: number;
  readonly promptLabel: string;
  readonly radius: number;
  readonly sign: BoulevardSign;
}

export interface BoulevardManifest {
  readonly worldWidth: number;
  readonly groundY: number;
  readonly referenceSheets: readonly string[];
  readonly planes: readonly BoulevardPlane[];
  readonly props: readonly BoulevardProp[];
  readonly locations: readonly BoulevardLocation[];
}

const PLANE_IDS: readonly BoulevardPlaneId[] = [
  'sky',
  'hills',
  'distant-buildings',
  'main-architecture',
  'sidewalk-street',
];

const LOCATION_IDS: readonly BoulevardLocationId[] = [
  'boarding-house',
  'casting-office',
  'diner',
  'backlot-gate',
  'extras-corral',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
    typeof value.scrollFactor === 'number' &&
    typeof value.depth === 'number' &&
    isArtSource(value.source)
  );
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
    typeof value.boardHeight === 'number'
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
    isSign(value.sign)
  );
}

/** Validates a manifest fetched from disk — the tool is a hand-editing
 * surface, so a malformed or half-saved file is a real possibility, not a
 * hypothetical. Falls back to DEFAULT_BOULEVARD_MANIFEST rather than
 * crashing the scene. */
export function isBoulevardManifest(value: unknown): value is BoulevardManifest {
  return (
    isRecord(value) &&
    typeof value.worldWidth === 'number' &&
    typeof value.groundY === 'number' &&
    Array.isArray(value.referenceSheets) &&
    value.referenceSheets.every((s) => typeof s === 'string') &&
    Array.isArray(value.planes) &&
    value.planes.length === PLANE_IDS.length &&
    value.planes.every(isPlane) &&
    Array.isArray(value.props) &&
    value.props.every(isProp) &&
    Array.isArray(value.locations) &&
    value.locations.length === LOCATION_IDS.length &&
    value.locations.every(isLocation)
  );
}

/** The exact layout BoulevardSpikeScene rendered before the manifest
 * existed — used if `data/boulevard-manifest.json` is missing or fails
 * validation, so a corrupt file degrades to the known-good layout instead
 * of a blank scene. */
const DEFAULT_BOULEVARD_MANIFEST_VALUE: BoulevardManifest = {
  worldWidth: 3790,
  groundY: 1056,
  referenceSheets: ['Hollywoodland_Concept_Boulevard.png'],
  planes: [
    {
      id: 'sky',
      label: 'Plane 1 — Sky',
      path: 'assets/environments/boulevard-v2/01-sky.png',
      offsetX: 0,
      offsetY: 0,
      scrollFactor: 0,
      depth: 0,
      source: null,
    },
    {
      id: 'hills',
      label: 'Plane 2 — Hills & landmark',
      path: 'assets/environments/boulevard-v2/02-hills-landmark.png',
      offsetX: -330,
      offsetY: -230,
      scrollFactor: 0.18,
      depth: 1,
      source: null,
    },
    {
      id: 'distant-buildings',
      label: 'Plane 3 — Distant buildings',
      path: 'assets/environments/boulevard-v2/03-distant-buildings.png',
      offsetX: 0,
      offsetY: 0,
      scrollFactor: 0.42,
      depth: 2,
      source: null,
    },
    {
      id: 'main-architecture',
      label: 'Plane 4 — Main architecture',
      path: 'assets/environments/boulevard-v2/04-main-architecture.png',
      offsetX: 0,
      offsetY: -117,
      scrollFactor: 1,
      depth: 3,
      source: null,
    },
    {
      id: 'sidewalk-street',
      label: 'Plane 5 — Sidewalk & street',
      path: 'assets/environments/boulevard-v2/05-sidewalk-street.png',
      offsetX: 0,
      offsetY: 430,
      scrollFactor: 1,
      depth: 10,
      source: null,
    },
  ],
  props: [
    {
      id: 'palm-left',
      label: 'Palm (left)',
      path: 'assets/environments/foreground/hollywood-palm-v1.png',
      x: 90,
      y: 1080,
      scale: 0.8,
      flipX: false,
      depth: 8,
      source: null,
    },
    {
      id: 'palm-right',
      label: 'Palm (right)',
      path: 'assets/environments/foreground/hollywood-palm-v1.png',
      x: 3695,
      y: 1080,
      scale: 0.9,
      flipX: true,
      depth: 8,
      source: null,
    },
    {
      id: 'streetlamp-left',
      label: 'Streetlamp (left)',
      path: 'assets/environments/foreground/hollywood-streetlamp-v1.png',
      x: 935,
      y: 1084,
      scale: 0.74,
      flipX: false,
      depth: 14,
      source: null,
    },
    {
      id: 'streetlamp-right',
      label: 'Streetlamp (right)',
      path: 'assets/environments/foreground/hollywood-streetlamp-v1.png',
      x: 2035,
      y: 1084,
      scale: 0.74,
      flipX: true,
      depth: 14,
      source: null,
    },
    {
      id: 'sedan',
      label: 'Parked sedan',
      path: 'assets/environments/foreground/hollywood-sedan-v1.png',
      x: 685,
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
      label: 'Boarding house',
      x: 1150,
      promptLabel: 'Enter boarding house',
      radius: 205,
      sign: {
        x: 1280,
        y: 590,
        text: 'BOARDING\nHOUSE',
        fontSize: 19,
        textColor: '#f3dfab',
        boardColor: '#241609',
        boardWidth: 210,
        boardHeight: 130,
      },
    },
    {
      id: 'casting-office',
      label: 'Casting office',
      x: 1675,
      promptLabel: 'Enter casting office',
      radius: 205,
      sign: {
        x: 1805,
        y: 590,
        text: 'SUNSET\nCASTING\nEXCHANGE',
        fontSize: 19,
        textColor: '#f3dfab',
        boardColor: '#241609',
        boardWidth: 210,
        boardHeight: 130,
      },
    },
    {
      id: 'diner',
      label: 'Sunset Diner',
      x: 2500,
      promptLabel: 'Enter Sunset Diner',
      radius: 205,
      sign: {
        x: 2630,
        y: 590,
        text: 'SUNSET\nDINER',
        fontSize: 19,
        textColor: '#f3dfab',
        boardColor: '#241609',
        boardWidth: 210,
        boardHeight: 130,
      },
    },
    {
      id: 'backlot-gate',
      label: 'Backlot gate',
      x: 3050,
      promptLabel: 'Wait at the backlot gate',
      radius: 205,
      sign: {
        x: 3180,
        y: 590,
        text: 'BACKLOT\nGATE',
        fontSize: 19,
        textColor: '#f3dfab',
        boardColor: '#241609',
        boardWidth: 210,
        boardHeight: 130,
      },
    },
    {
      id: 'extras-corral',
      label: 'Extras corral',
      x: 3600,
      promptLabel: 'Check in at the extras corral',
      radius: 205,
      sign: {
        x: 3730,
        y: 590,
        text: 'EXTRAS\nCORRAL',
        fontSize: 19,
        textColor: '#f3dfab',
        boardColor: '#241609',
        boardWidth: 210,
        boardHeight: 130,
      },
    },
  ],
};

export const DEFAULT_BOULEVARD_MANIFEST: BoulevardManifest = Object.freeze(DEFAULT_BOULEVARD_MANIFEST_VALUE);
