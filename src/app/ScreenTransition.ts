/** How long the screen takes to fade to black, and again to fade back in. Matches .screen-fade's transition in styles.css. */
export const FADE_MS = 400;

/** The bit of the black overlay the transition drives; a real element satisfies it, and tests pass a fake. */
interface FadeOverlay {
  readonly classList: { add(name: string): void; remove(name: string): void };
  readonly style: { setProperty(name: string, value: string): void };
}

/**
 * Changes screen by dipping through black: the current screen fades out, `swap` changes what is showing while nothing
 * can be seen, then the new screen fades in. `swap` may be async, and the screen stays black until it settles, so it can
 * hold the fade-in until the Boulevard has actually drawn its first frame.
 *
 * Only one transition runs at a time. A second request during one (a double-click, a held Enter) is ignored, and the
 * overlay blocks the pointer while it is up.
 */
export class ScreenTransition {
  private busy = false;

  public constructor(
    private readonly overlay: FadeOverlay,
    private readonly wait: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms)),
    /** Reduce-motion turns the CSS transition off, so there is nothing to wait for either. */
    private readonly reducedMotion: () => boolean = () => document.body.classList.contains('reduced-motion'),
  ) {}

  public get isRunning(): boolean {
    return this.busy;
  }

  /** Resolves true once the new screen has faded in, or false straight away when another transition is already running
   * (in which case `swap` is not called). The overlay always comes back down, even if `swap` throws. `fadeInMs` lengthens
   * just the fade back in from black, for a reveal that should linger. */
  public async run(swap: () => void | Promise<void>, { fadeInMs = FADE_MS }: { readonly fadeInMs?: number } = {}): Promise<boolean> {
    if (this.busy) return false;
    this.busy = true;
    try {
      this.overlay.classList.add('active');
      await this.settle();
      await swap();
    } finally {
      // The CSS transition takes its length from the state it is heading to, so this only affects the fade back in.
      this.overlay.style.setProperty('--fade-in-ms', `${fadeInMs}ms`);
      this.overlay.classList.remove('active');
      await this.settle(fadeInMs);
      this.busy = false;
    }
    return true;
  }

  private settle(ms: number = FADE_MS): Promise<void> {
    return this.reducedMotion() ? Promise.resolve() : this.wait(ms);
  }
}
