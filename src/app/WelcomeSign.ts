import { StagedReveal } from './StagedReveal';

/** How long the finished sign stays up before it moves on by itself, and when each line fades in. */
const HOLD_MS = 1800;
const REDUCED_MOTION_HOLD_MS = 1500;
/** After a click skips it, ignore further clicks this long, so a double-click cannot dismiss two things at once. */
const SKIP_GRACE_MS = 250;

export interface WelcomeText {
  readonly city: string;
  readonly subtitle: string;
  readonly population: string;
}

/**
 * The classic roadside "Welcome to ..." sign shown on arriving somewhere: the words fade in one line after another, hold for a
 * moment, and the sign moves on by itself. A click or Enter skips it at any time. Reduce Motion shows it whole, for a shorter time.
 * The markup is in index.html; this fills the words in and times the reveal.
 */
export class WelcomeSign {
  private readonly revealed: HTMLElement[];
  private reveal: StagedReveal | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private onDone: (() => void) | undefined;
  private shownAt = Number.NEGATIVE_INFINITY;

  public constructor(
    private readonly root: HTMLElement,
    private readonly reducedMotion: () => boolean = () => document.body.classList.contains('reduced-motion'),
  ) {
    this.revealed = [
      root.querySelector<HTMLElement>('.welcome-kicker'),
      root.querySelector<HTMLElement>('.welcome-city'),
      root.querySelector<HTMLElement>('.welcome-subtitle'),
      root.querySelector<HTMLElement>('.welcome-rule'),
      root.querySelector<HTMLElement>('.welcome-population'),
      root.querySelector<HTMLElement>('.welcome-hint'),
    ].filter((element): element is HTMLElement => element !== null);
    for (const element of this.revealed) element.dataset.reveal = '';
    root.addEventListener('click', () => this.finish());
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      if (!event.repeat) this.finish();
    });
  }

  /** Shows the sign with nothing revealed yet, for a fade-in to uncover. */
  public prepare(text: WelcomeText): void {
    this.cancel();
    const set = (selector: string, value: string): void => {
      const element = this.root.querySelector<HTMLElement>(selector);
      if (element !== null) element.textContent = value;
    };
    set('#welcome-city', text.city);
    set('#welcome-subtitle', text.subtitle);
    set('#welcome-population', text.population);
    for (const element of this.revealed) element.classList.remove('shown');
    this.shownAt = performance.now();
    this.root.hidden = false;
    this.root.focus();
  }

  /** Plays the reveal and resolves when the sign is done: it ran its course, or the player skipped it. */
  public play(): Promise<void> {
    return new Promise((resolve) => {
      this.onDone = resolve;
      if (this.reducedMotion()) {
        for (const element of this.revealed) element.classList.add('shown');
        this.timer = setTimeout(() => this.finish(), REDUCED_MOTION_HOLD_MS);
        return;
      }
      const steps = this.revealed.map((element, index) => ({ atMs: index * 420, reveal: () => element.classList.add('shown') }));
      this.reveal = new StagedReveal(steps, () => {
        this.timer = setTimeout(() => this.finish(), HOLD_MS);
      });
      this.reveal.start();
    });
  }

  public hide(): void {
    this.cancel();
    this.root.hidden = true;
  }

  private finish(): void {
    if (this.onDone === undefined) return;
    if (performance.now() - this.shownAt < SKIP_GRACE_MS) return;
    const done = this.onDone;
    this.cancel();
    done();
  }

  private cancel(): void {
    // Skipping the reveal reports it complete, which would start the hold timer, so clear the timer after.
    this.reveal?.skip();
    this.reveal = undefined;
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    this.onDone = undefined;
  }
}
