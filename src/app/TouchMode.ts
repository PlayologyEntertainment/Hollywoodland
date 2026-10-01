/** Marks the page `touch` when the main input is a finger (a phone or tablet), so touch layouts key off the input rather than the
 * window width: a narrow desktop window stays a desktop. It follows the query live (a tablet docked to a mouse, a devtools toggle). */
export const TOUCH_QUERY = '(pointer: coarse)';

export function applyTouchMode(
  root: Pick<HTMLElement, 'classList'>,
  matchMedia: (query: string) => Pick<MediaQueryList, 'matches' | 'addEventListener'>,
): void {
  const query = matchMedia(TOUCH_QUERY);
  const update = (): void => void root.classList.toggle('touch', query.matches);
  update();
  query.addEventListener('change', update);
}
