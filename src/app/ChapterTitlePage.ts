import { mountDecoBorder } from '../ui/DecoBorder';
import { StagedReveal } from './StagedReveal';

/** After a click skips the reveal, ignore further clicks this long, so a double-click cannot skip and then leave in one go. */
const SKIP_GRACE_MS = 400;

/**
 * The chapter title page, a silent-film title card shown between the Character Creator and the Boulevard.
 *
 * Everything on it is in index.html already (screen readers get all of it at once); this only paints it in. Each element
 * marked `data-reveal="<ms>"` fades in that many milliseconds after the page starts. A click or Enter/Space while that is
 * going on jumps to the finished page, and once it is finished the next one leaves. Reduce Motion shows it all at once.
 */
export class ChapterTitlePage {
  private readonly reveal: StagedReveal;
  private readonly revealed: HTMLElement[];
  private complete = false;
  private dismissed = false;
  private skippedAt = Number.NEGATIVE_INFINITY;
  private onDismissed: () => void = () => undefined;

  public constructor(
    private readonly root: HTMLElement,
    private readonly reducedMotion: () => boolean = () => document.body.classList.contains('reduced-motion'),
  ) {
    mountDecoBorder(root);
    this.revealed = [...root.querySelectorAll<HTMLElement>('[data-reveal]')];
    const steps = this.revealed
      .map((element) => ({ atMs: Number(element.dataset.reveal), reveal: () => element.classList.add('shown') }))
      .sort((a, b) => a.atMs - b.atMs);
    this.reveal = new StagedReveal(steps, () => {
      this.complete = true;
    });

    root.addEventListener('click', () => this.advance());
    root.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      // A held key must not repeat straight through the page.
      event.preventDefault();
      if (!event.repeat) this.advance();
    });
  }

  /** Shows the page with nothing revealed yet, for a fade-in to uncover. */
  public prepare(): void {
    for (const element of this.revealed) element.classList.remove('shown');
    this.complete = false;
    this.dismissed = false;
    this.skippedAt = Number.NEGATIVE_INFINITY;
    this.root.hidden = false;
    this.root.focus();
  }

  /** Plays the reveal, and resolves when the player leaves the page. */
  public play(): Promise<void> {
    return new Promise((resolve) => {
      this.onDismissed = resolve;
      if (this.reducedMotion()) this.reveal.skip();
      else this.reveal.start();
    });
  }

  public hide(): void {
    this.root.hidden = true;
  }

  private advance(): void {
    if (this.dismissed) return;
    if (!this.complete) {
      this.reveal.skip();
      this.skippedAt = performance.now();
      return;
    }
    if (performance.now() - this.skippedAt < SKIP_GRACE_MS) return;
    this.dismissed = true;
    this.onDismissed();
  }
}
