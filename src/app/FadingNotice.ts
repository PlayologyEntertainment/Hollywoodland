/** How long a notice takes to fade away. Matches `.notice-fading`'s transition in styles.css. */
export const NOTICE_FADE_MS = 600;

/** The parts of a notice element this needs; a real element satisfies it, and tests pass a fake. */
interface NoticeElement {
  /** A real element's `hidden` is a boolean or the string "until-found"; either way, truthy means not showing. */
  hidden: boolean | string;
  readonly classList: { add(name: string): void; remove(name: string): void };
}

/**
 * A floating notice (the entrance prompt, a toast) that shows at once and fades away gently instead of blinking out.
 *
 * `show` makes it visible immediately, with no transition, and cancels any fade in progress (so a notice that comes back
 * mid-fade is just there again). `hide` fades it out over `NOTICE_FADE_MS`, and only then really hides it, because a hidden
 * element cannot fade. The fade is a CSS transition on the `notice-fading` class, which is off while the notice is showing;
 * that is what makes the appearing instant.
 */
export class FadingNotice {
  private timer: ReturnType<typeof setTimeout> | undefined;

  public constructor(
    private readonly element: NoticeElement,
    private readonly fadeMs: number = NOTICE_FADE_MS,
  ) {}

  public show(): void {
    this.cancel();
    this.element.classList.remove('notice-fading');
    this.element.hidden = false;
  }

  public hide(): void {
    // Nothing to fade if it is not showing, and a second hide must not restart a fade that is already running.
    if (this.element.hidden || this.timer !== undefined) return;
    this.element.classList.add('notice-fading');
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.element.hidden = true;
      this.element.classList.remove('notice-fading');
    }, this.fadeMs);
  }

  /** Takes the notice away at once, with no fade, for when the whole scene it belongs to is going too. */
  public hideNow(): void {
    this.cancel();
    this.element.classList.remove('notice-fading');
    this.element.hidden = true;
  }

  private cancel(): void {
    if (this.timer === undefined) return;
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
