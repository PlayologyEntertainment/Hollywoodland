/** Turns a stream of frame timestamps into a frames-per-second figure that is steady enough to read.
 *
 * Frames are counted over a window (half a second by default) and the figure is only released when the window closes, so the
 * readout refreshes twice a second instead of flickering every frame. */
export const FPS_WINDOW_MS = 500;

export class FpsMeter {
  private windowStart: number | undefined;
  private frames = 0;

  public constructor(private readonly windowMs: number = FPS_WINDOW_MS) {}

  /** Records one frame drawn at `nowMs`. Returns the rounded FPS when a window has just closed, otherwise `undefined`. */
  public frame(nowMs: number): number | undefined {
    if (this.windowStart === undefined) {
      this.windowStart = nowMs;
      this.frames = 0;
      return undefined;
    }
    this.frames += 1;
    const elapsed = nowMs - this.windowStart;
    if (elapsed < this.windowMs) return undefined;
    const fps = Math.round((this.frames * 1000) / elapsed);
    this.windowStart = nowMs;
    this.frames = 0;
    return fps;
  }

  /** Forgets the current window, so a gap (a hidden tab, a paused game) is not averaged in as a slow stretch. */
  public reset(): void {
    this.windowStart = undefined;
    this.frames = 0;
  }
}
