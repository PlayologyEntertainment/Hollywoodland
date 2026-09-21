/** One thing to bring on screen, and when (milliseconds after the reveal starts). */
export interface RevealStep {
  readonly atMs: number;
  readonly reveal: () => void;
}

/**
 * Brings a list of things on screen one after another, and can jump straight to the end. It only keeps time and order;
 * what "revealing" means (adding a class, say) is up to each step. `onComplete` runs once the last step has been revealed,
 * whether the clock got there or a skip did.
 */
export class StagedReveal {
  private readonly timers: Array<ReturnType<typeof setTimeout>> = [];
  private readonly shown: boolean[];

  public constructor(
    private readonly steps: readonly RevealStep[],
    private readonly onComplete: () => void = () => undefined,
  ) {
    this.shown = steps.map(() => false);
  }

  public get isComplete(): boolean {
    return this.shown.every(Boolean);
  }

  /** Starts the reveal from the beginning. The caller resets whatever the steps changed. */
  public start(): void {
    this.cancel();
    this.shown.fill(false);
    this.steps.forEach((step, index) => {
      this.timers.push(setTimeout(() => this.show(index), step.atMs));
    });
  }

  /** Reveals everything not yet shown, right now. */
  public skip(): void {
    this.cancel();
    this.steps.forEach((_, index) => this.show(index));
  }

  private show(index: number): void {
    if (this.shown[index] === true) return;
    this.shown[index] = true;
    this.steps[index]?.reveal();
    if (this.isComplete) this.onComplete();
  }

  private cancel(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.length = 0;
  }
}
