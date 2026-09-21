/**
 * A generated Art Deco line border, in the fine-line rectilinear style of the 1930s: everything is a right angle drawn in one
 * hairline stroke. Two close parallel rules run round the box; a keyline inside them steps around each corner; and at each
 * corner two small hollow squares overlap, the larger one overshooting the rules. A hollow diamond sits in a gap in the
 * rules at the middle of each side.
 *
 * It is drawn from a few numbers, so it fits any size, and every part scales from one `unit`, so a big page and a small
 * panel get the same look. `decoBorderSvg` is a pure function that returns SVG markup (easy to test, and usable as an
 * image). `mountDecoBorder` puts one inside an element and keeps it fitted as the element is resized. Colour comes from
 * CSS: it draws in `currentColor`, so set `color` on `.deco-border` (or the host) to change it.
 */

export interface DecoBorderOptions {
  /** Size of everything, in px: the margin round the border, the corner squares, the keyline's steps and the diamonds all
   * scale from it. */
  readonly unit: number;
  /** Stroke width of every line, in px. */
  readonly strokeWidth: number;
}

/** A unit that suits a box: about 1/28 of its shorter side, kept between a small and a large size. */
export function defaultUnit(width: number, height: number): number {
  return Math.min(26, Math.max(10, Math.min(width, height) / 28));
}

type Point = readonly [number, number];

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function pointList(points: readonly Point[]): string {
  return points.map(([x, y]) => `${round(x)} ${round(y)}`).join('L');
}

/** An open square outline with its top-left corner at (x, y). */
function square(x: number, y: number, side: number): string {
  return `M${pointList([[x, y], [x + side, y], [x + side, y + side], [x, y + side]])}Z`;
}

/** A diamond outline centred on (cx, cy) with the given half-diagonal. */
function diamond(cx: number, cy: number, half: number): string {
  return `M${pointList([[cx, cy - half], [cx + half, cy], [cx, cy + half], [cx - half, cy]])}Z`;
}

/** A rectangle's outline, broken at the middle of each side by a gap `gapHalf` either way. Each of the four pieces is one
 * corner with the two half-sides running from it, so the corners stay properly joined. */
function brokenRect(x0: number, y0: number, x1: number, y1: number, gapHalf: number): string {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const corner = (start: Point, mid: Point, end: Point): string => `M${pointList([start, mid, end])}`;
  return (
    corner([cx + gapHalf, y0], [x1, y0], [x1, cy - gapHalf]) +
    corner([x1, cy + gapHalf], [x1, y1], [cx + gapHalf, y1]) +
    corner([cx - gapHalf, y1], [x0, y1], [x0, cy + gapHalf]) +
    corner([x0, cy - gapHalf], [x0, y0], [cx - gapHalf, y0])
  );
}

/** A closed rectangle with a square bite taken out of each corner, `step` along each edge: the keyline that steps round
 * the corner squares. */
function steppedRect(x0: number, y0: number, x1: number, y1: number, step: number): string {
  return `M${pointList([
    [x0 + step, y0], [x1 - step, y0], [x1 - step, y0 + step], [x1, y0 + step],
    [x1, y1 - step], [x1 - step, y1 - step], [x1 - step, y1], [x0 + step, y1],
    [x0 + step, y1 - step], [x0, y1 - step], [x0, y0 + step], [x0 + step, y0 + step],
  ])}Z`;
}

/** The border as SVG markup for a `width` x `height` box. Nothing is drawn if the box is too small to hold it. */
export function decoBorderSvg(width: number, height: number, options: Partial<DecoBorderOptions> = {}): string {
  const unit = options.unit ?? defaultUnit(width, height);
  const strokeWidth = options.strokeWidth ?? Math.max(1, unit / 18);

  const margin = unit;
  const gap = unit * 0.32; // between the two parallel rules
  const bigSquare = unit * 1.5;
  const bigOvershoot = unit * 0.45; // how far the big corner square sticks out past the outer rule
  const smallSquare = unit * 0.75;
  const smallOffset = unit * 0.75; // in from the outer rule, so it straddles the big square's inner edge
  const keylineInset = margin + gap + unit * 0.5;
  const keylineStep = unit * 0.85;
  const diamondHalf = unit * 0.55;
  const diamondGap = diamondHalf + unit * 0.3;

  // The keyline's bites must still leave room between them along each side.
  const needed = 2 * (keylineInset + keylineStep) + diamondGap * 2;
  if (width < needed || height < needed) return '';

  const outer = brokenRect(margin, margin, width - margin, height - margin, diamondGap);
  const inner = brokenRect(margin + gap, margin + gap, width - margin - gap, height - margin - gap, diamondGap);
  const keyline = steppedRect(keylineInset, keylineInset, width - keylineInset, height - keylineInset, keylineStep);

  // Two overlapping squares at each corner. `sx`/`sy` are 1 at the left/top and -1 at the right/bottom, so one formula
  // places all four (a square's top-left is found by taking away its own side when it hangs off the right or bottom).
  const squares = ([[1, 1], [-1, 1], [1, -1], [-1, -1]] as const)
    .map(([sx, sy]) => {
      const place = (edge: number, side: number, from: number, direction: number, extent: number): number =>
        direction > 0 ? from + edge : extent - from - edge - side;
      const bigX = place(-bigOvershoot, bigSquare, margin, sx, width);
      const bigY = place(-bigOvershoot, bigSquare, margin, sy, height);
      const smallX = place(smallOffset, smallSquare, margin, sx, width);
      const smallY = place(smallOffset, smallSquare, margin, sy, height);
      return square(bigX, bigY, bigSquare) + square(smallX, smallY, smallSquare);
    })
    .join('');

  const band = margin + gap / 2; // the diamonds sit in the band between the two rules
  const diamonds = [
    diamond(width / 2, band, diamondHalf),
    diamond(width / 2, height - band, diamondHalf),
    diamond(band, height / 2, diamondHalf),
    diamond(width - band, height / 2, diamondHalf),
  ].join('');

  const w = round(width);
  const h = round(height);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false">` +
    `<g fill="none" stroke="currentColor" stroke-width="${round(strokeWidth)}" stroke-linejoin="miter" stroke-linecap="butt">` +
    `<path d="${outer}${inner}"/>` +
    `<path d="${keyline}"/>` +
    `<path d="${squares}"/>` +
    `<path d="${diamonds}"/>` +
    `</g>` +
    `</svg>`
  );
}

/** Puts a border inside `host`, behind its other content, and refits it whenever the host changes size. The host needs a
 * positioned box (`position` other than static). Returns a function that removes the border. */
export function mountDecoBorder(host: HTMLElement, options: Partial<DecoBorderOptions> = {}): () => void {
  const layer = document.createElement('div');
  layer.className = 'deco-border';
  layer.setAttribute('aria-hidden', 'true');
  host.insertAdjacentElement('afterbegin', layer);
  const draw = (): void => {
    layer.innerHTML = decoBorderSvg(layer.clientWidth, layer.clientHeight, options);
  };
  const observer = new ResizeObserver(draw);
  observer.observe(layer);
  draw();
  return () => {
    observer.disconnect();
    layer.remove();
  };
}
