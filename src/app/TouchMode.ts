/** Marks the page `touch` when the main input is a finger (a phone or tablet), so touch layouts key off the input rather than the
 * window width: a narrow desktop window stays a desktop. It follows the query live (a tablet docked to a mouse, a devtools toggle).
 * `?touch=1` / `?touch=0` in the address forces it on or off, for trying the phone layout in a desktop browser. */
export const TOUCH_QUERY = '(pointer: coarse)';

/** A touch device held sideways with little height: a phone. There the header floats over the picture and the footer's buttons move
 * up into it (see AppShell.trackBarHeights). The same condition is written out in styles.css, under `.touch`; a test keeps them equal. */
export const PHONE_LANDSCAPE_QUERY = '(orientation: landscape) and (max-height: 560px)';

export function applyTouchMode(
  root: Pick<HTMLElement, 'classList'>,
  matchMedia: (query: string) => Pick<MediaQueryList, 'matches' | 'addEventListener'>,
  search = '',
): void {
  const forced = new URLSearchParams(search).get('touch');
  if (forced === '1' || forced === '0') {
    root.classList.toggle('touch', forced === '1');
    return;
  }
  const query = matchMedia(TOUCH_QUERY);
  const update = (): void => void root.classList.toggle('touch', query.matches);
  update();
  query.addEventListener('change', update);
}
