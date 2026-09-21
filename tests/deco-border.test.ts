import { describe, expect, it } from 'vitest';

import { decoBorderSvg, decoOutlineSvg, defaultUnit } from '../src/ui/DecoBorder';

/** The `d` of each of the border's four paths, in order: the two rules, the keyline, the corner squares, the diamonds. */
function paths(svg: string): string[] {
  return [...svg.matchAll(/<path d="([^"]*)"[^>]*\/>/g)].map((match) => match[1] ?? '');
}

/** Each sub-path (one M... run) as a list of points, closed sub-paths repeating their first point at the end. */
function subpaths(d: string): Array<Array<[number, number]>> {
  return d
    .split('M')
    .filter((part) => part.length > 0)
    .map((part) => {
      const points = part
        .replace('Z', '')
        .split('L')
        .map((pair) => pair.trim().split(' ').map(Number) as [number, number]);
      if (part.endsWith('Z')) points.push(points[0] as [number, number]);
      return points;
    });
}

/** Whether every segment of every sub-path runs straight across or straight up and down. */
function isRectilinear(d: string): boolean {
  return subpaths(d).every((points) =>
    points.every((point, index) => {
      const previous = points[index - 1];
      return previous === undefined || previous[0] === point[0] || previous[1] === point[1];
    }),
  );
}

describe('decoBorderSvg', () => {
  const svg = decoBorderSvg(1280, 720);
  const [rules = '', keyline = '', squares = '', diamonds = ''] = paths(svg);

  it('draws the rules, the keyline, the corner squares and the diamonds as four hairline paths in currentColor', () => {
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('viewBox="0 0 1280 720"');
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('fill="none"');
    expect(paths(svg)).toHaveLength(4);
    // Two rules in four pieces each (broken at the middle of each side), open.
    expect(subpaths(rules)).toHaveLength(8);
    expect(rules).not.toContain('Z');
    // One closed keyline; two squares at each of four corners; four diamonds.
    expect(subpaths(keyline)).toHaveLength(1);
    expect(keyline.endsWith('Z')).toBe(true);
    expect(subpaths(squares)).toHaveLength(8);
    expect(subpaths(diamonds)).toHaveLength(4);
  });

  it('is all right angles, like a 1930s line border: no curves, and no diagonals except the diamonds', () => {
    // Path data is only moves, straight lines and closes: no arc or curve commands.
    for (const d of paths(svg)) expect(d).not.toMatch(/[ACQSTHV]/);
    for (const d of [rules, keyline, squares]) expect(isRectilinear(d)).toBe(true);
    expect(isRectilinear(diamonds)).toBe(false);
  });

  it('keeps the lines fine at ordinary sizes, and lets the caller choose the weight', () => {
    const width = Number(svg.match(/stroke-width="([\d.]+)"/)?.[1]);
    expect(width).toBeGreaterThanOrEqual(1);
    expect(width).toBeLessThanOrEqual(2);
    expect(decoBorderSvg(1280, 720, { strokeWidth: 3 })).toContain('stroke-width="3"');
  });

  it('never writes NaN or Infinity, and keeps everything inside the box', () => {
    expect(svg).not.toMatch(/NaN|Infinity/);
    for (const d of [rules, keyline, squares, diamonds]) {
      for (const [x, y] of subpaths(d).flat()) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(1280);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(720);
      }
    }
  });

  it('is symmetric: the corner squares mirror across both axes', () => {
    // Each square's four corners, without the repeat of the first that closes it (which has no mirror partner).
    const points = subpaths(squares).flatMap((square) => square.slice(0, -1));
    const sortedXs = points.map(([x]) => x).sort((a, b) => a - b);
    const mirroredXs = points.map(([x]) => 1280 - x).sort((a, b) => a - b);
    const sortedYs = points.map(([, y]) => y).sort((a, b) => a - b);
    const mirroredYs = points.map(([, y]) => 720 - y).sort((a, b) => a - b);
    // Coordinates are rounded to 0.01 when written, so mirrored values can differ in the last digit.
    sortedXs.forEach((x, index) => expect(x).toBeCloseTo(mirroredXs[index] ?? Number.NaN, 1));
    sortedYs.forEach((y, index) => expect(y).toBeCloseTo(mirroredYs[index] ?? Number.NaN, 1));
  });

  it('is deterministic', () => {
    expect(decoBorderSvg(1280, 720)).toBe(svg);
  });

  it('scales its whole design with the unit', () => {
    // The larger corner square sticks out 0.45 units past the margin (one unit), so the leftmost line is 0.55 units in.
    const leftmost = (unit: number): number => Math.min(...subpaths(paths(decoBorderSvg(1280, 720, { unit }))[2] ?? '').flat().map(([x]) => x));
    expect(leftmost(10)).toBeCloseTo(5.5);
    expect(leftmost(20)).toBeCloseTo(11);
  });

  it('draws nothing when the box is too small to hold the border', () => {
    expect(decoBorderSvg(0, 0)).toBe('');
    expect(decoBorderSvg(60, 60)).toBe('');
  });

  it('picks a unit from the box, within limits', () => {
    expect(defaultUnit(100, 100)).toBe(10);
    expect(defaultUnit(4000, 4000)).toBe(26);
    expect(defaultUnit(1280, 720)).toBeCloseTo(720 / 28);
  });
});

describe('decoOutlineSvg (the plain outline round a bar)', () => {
  const svg = decoOutlineSvg(1600, 56);
  const [outline = ''] = paths(svg);
  const points = subpaths(outline).flat();

  it('is one closed line in currentColor: 1px wide, drawn crisp', () => {
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('viewBox="0 0 1600 56"');
    expect(paths(svg)).toHaveLength(1);
    expect(subpaths(outline)).toHaveLength(1);
    expect(outline.endsWith('Z')).toBe(true);
    expect(svg).toContain('stroke="currentColor"');
    expect(svg).toContain('fill="none"');
    expect(svg).toContain('stroke-width="1"');
    expect(svg).toContain('shape-rendering="crispEdges"');
  });

  it('is all right angles, with no curves and no diagonals', () => {
    expect(outline).not.toMatch(/[ACQSTHV]/);
    expect(isRectilinear(outline)).toBe(true);
  });

  it('runs 2px in from every edge: the line fills pixels 2 to 3, so its middle is at 2.5', () => {
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    expect(Math.min(...xs)).toBeCloseTo(2.5);
    expect(Math.max(...xs)).toBeCloseTo(1600 - 2.5);
    expect(Math.min(...ys)).toBeCloseTo(2.5);
    expect(Math.max(...ys)).toBeCloseTo(56 - 2.5);
  });

  it('steps in at each corner to make a 4px square indent', () => {
    const has = (x: number, y: number): boolean => points.some(([px, py]) => Math.abs(px - x) < 0.01 && Math.abs(py - y) < 0.01);
    // Top left: along the top to 4px short of the corner, in 4px, and along to the left edge, then down it.
    expect(has(2.5 + 4, 2.5)).toBe(true);
    expect(has(2.5 + 4, 2.5 + 4)).toBe(true);
    expect(has(2.5, 2.5 + 4)).toBe(true);
    // And the same at the bottom right.
    expect(has(1600 - 2.5 - 4, 56 - 2.5)).toBe(true);
    expect(has(1600 - 2.5 - 4, 56 - 2.5 - 4)).toBe(true);
    expect(has(1600 - 2.5, 56 - 2.5 - 4)).toBe(true);
    // Twelve corners in all (three for each of the four bites), and the closing repeat of the first.
    expect(points).toHaveLength(13);
  });

  it('is symmetric left to right and top to bottom', () => {
    const corners = points.slice(0, -1);
    for (const [x, y] of corners) {
      expect(corners.some(([mx, my]) => Math.abs(mx - (1600 - x)) < 0.01 && Math.abs(my - y) < 0.01)).toBe(true);
      expect(corners.some(([mx, my]) => Math.abs(mx - x) < 0.01 && Math.abs(my - (56 - y)) < 0.01)).toBe(true);
    }
  });

  it('takes its gap, indent and width from options, and is deterministic', () => {
    expect(decoOutlineSvg(1600, 56)).toBe(svg);
    const custom = decoOutlineSvg(1600, 56, { gap: 3, step: 6, strokeWidth: 2 });
    expect(custom).toContain('stroke-width="2"');
    const customPoints = subpaths(paths(custom)[0] ?? '').flat();
    expect(Math.min(...customPoints.map(([x]) => x))).toBeCloseTo(4);
    expect(customPoints.some(([x, y]) => Math.abs(x - 10) < 0.01 && Math.abs(y - 4) < 0.01)).toBe(true);
  });

  it('draws nothing when the box is too small to hold it', () => {
    expect(decoOutlineSvg(0, 0)).toBe('');
    expect(decoOutlineSvg(10, 56)).toBe('');
    expect(decoOutlineSvg(1600, 10)).toBe('');
  });
});
