import type { RegionId } from '../domain/Travel';

/** The picture of Hollywoodland on the Union Bus Depot's map (`public/assets/ui/hollywoodland-map.webp`) and where each region
 * lies on it, in the picture's own pixels. The regions are drawn by hand over the art, edge to edge with no gaps, so every point on
 * the map belongs to exactly one place. */
export const WORLD_MAP_IMAGE = 'assets/ui/hollywoodland-map.webp';
export const WORLD_MAP_SIZE = { width: 1536, height: 1024 } as const;

export type MapPoint = readonly [number, number];

export interface MapRegion {
  readonly id: RegionId;
  /** The outline, clockwise. */
  readonly points: readonly MapPoint[];
  /** Where the name tag sits: clear of the region's main landmark. */
  readonly label: MapPoint;
}

export const MAP_REGIONS: readonly MapRegion[] = Object.freeze([
  {
    id: 'hollywood-bowl',
    label: [330, 52],
    points: [[0, 0], [700, 0], [700, 110], [650, 210], [560, 300], [430, 330], [330, 330], [230, 325], [110, 315], [0, 300]],
  },
  {
    id: 'griffith-observatory',
    label: [1130, 62],
    points: [[700, 0], [1536, 0], [1536, 440], [1430, 410], [1300, 340], [1200, 300], [1120, 230], [1000, 185], [900, 160], [790, 150], [700, 110]],
  },
  {
    id: 'santa-monica-pier',
    label: [210, 940],
    points: [[0, 300], [110, 315], [230, 325], [330, 380], [360, 500], [420, 610], [520, 690], [610, 770], [670, 880], [710, 1024], [0, 1024]],
  },
  {
    id: 'monarch-lot',
    label: [1250, 965],
    points: [[1536, 440], [1536, 1024], [900, 1024], [930, 900], [1000, 790], [1030, 680], [1140, 590], [1230, 520], [1340, 470], [1440, 450]],
  },
  {
    id: 'hollywood-boulevard',
    label: [900, 250],
    points: [
      [330, 330], [430, 330], [560, 300], [650, 210], [700, 110], [790, 150], [900, 160], [1000, 185], [1120, 230], [1200, 300], [1300, 340],
      [1430, 410], [1536, 440], [1440, 450], [1340, 470], [1230, 520], [1140, 590], [1030, 680], [1000, 790], [930, 900], [900, 1024],
      [710, 1024], [670, 880], [610, 770], [520, 690], [420, 610], [360, 500], [330, 380],
    ],
  },
]);

export function regionOutline(region: MapRegion): string {
  return region.points.map(([x, y]) => `${x},${y}`).join(' ');
}
