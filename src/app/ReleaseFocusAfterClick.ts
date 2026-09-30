/** The slice of an element this needs; a real element satisfies it, and tests pass a fake. */
export interface FocusReleaseContainer {
  addEventListener(type: 'click', listener: (event: FocusReleaseClick) => void): void;
  contains(other: unknown): boolean;
}

export interface FocusReleaseClick {
  /** 0 for a click made with the keyboard (Enter or Space on a focused button), 1 or more for a mouse or touch click. */
  readonly detail: number;
  readonly target: { closest(selector: string): { blur(): void } | null } | null;
}

/** After the player clicks a button in `container` with the mouse, lets go of its keyboard focus.
 *
 * A clicked button stays focused. The next movement key (A/D or the arrows) then flips the browser into keyboard mode, and
 * `:focus-visible` lights that button's outline and tooltip long after the mouse has left it. Releasing focus after a mouse
 * click prevents that. A click made with the keyboard (detail 0) is left alone, so someone tabbing between buttons keeps their
 * focus ring and their place. */
export function releaseFocusAfterMouseClick(container: FocusReleaseContainer): void {
  container.addEventListener('click', (event) => {
    if (event.detail === 0) return;
    const button = event.target?.closest('button') ?? null;
    if (button !== null && container.contains(button)) button.blur();
  });
}
