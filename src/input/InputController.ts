export type InputAction = 'moveLeft' | 'moveRight' | 'interact' | 'journal' | 'pause';
export type InputBindings = Readonly<Record<InputAction, readonly string[]>>;

export const DEFAULT_BINDINGS: InputBindings = Object.freeze({
  moveLeft: ['ArrowLeft', 'KeyA'],
  moveRight: ['ArrowRight', 'KeyD'],
  interact: ['Enter', 'KeyE'],
  journal: ['KeyJ'],
  pause: ['Escape'],
});

/** How long a touch press still counts after the finger lifts. */
const VIRTUAL_PRESS_GRACE_MS = 150;

const PREVENT_DEFAULT_ACTIONS = new Set<InputAction>(['moveLeft', 'moveRight', 'interact']);

export class InputController {
  private readonly pressed = new Set<string>();
  private readonly justPressed = new Set<string>();
  private gameplayActive = false;
  /** Actions held by on-screen touch controls, which behave exactly like held keys. */
  private readonly virtualDown = new Set<InputAction>();
  /** Each held press and the moment it stops counting (Infinity while the finger is still down). */
  private readonly virtualPressed = new Map<InputAction, number>();
  private readonly activeListeners = new Set<(active: boolean) => void>();

  public constructor(
    private readonly eventTarget: Pick<Window, 'addEventListener' | 'removeEventListener'>,
    private bindings: InputBindings = DEFAULT_BINDINGS,
  ) {
    this.eventTarget.addEventListener('keydown', this.onKeyDown as EventListener);
    this.eventTarget.addEventListener('keyup', this.onKeyUp as EventListener);
  }

  public setGameplayActive(active: boolean): void {
    this.gameplayActive = active;
    if (!active) {
      this.pressed.clear();
      this.justPressed.clear();
      this.virtualDown.clear();
      this.virtualPressed.clear();
    }
    for (const listener of this.activeListeners) listener(active);
  }

  /** Tells the on-screen touch controls when gameplay switches on and off (a dialog opening, the menu), so they can step aside. */
  public onGameplayActiveChange(listener: (active: boolean) => void): () => void {
    this.activeListeners.add(listener);
    return () => this.activeListeners.delete(listener);
  }

  /** An on-screen control holding an action down or letting go, the touch twin of a key going down or up. */
  public setVirtualDown(action: InputAction, down: boolean): void {
    if (!down) {
      this.virtualDown.delete(action);
      // A quick tap can be over before the game's next frame looks, so a press outlives its release for a moment (and is then dropped, so
      // it cannot fire later when the player has walked up to something).
      if (this.virtualPressed.has(action)) this.virtualPressed.set(action, performance.now() + VIRTUAL_PRESS_GRACE_MS);
      return;
    }
    if (!this.gameplayActive || this.virtualDown.has(action)) return;
    this.virtualDown.add(action);
    this.virtualPressed.set(action, Infinity);
  }

  public isDown(action: InputAction): boolean {
    return this.gameplayActive && (this.virtualDown.has(action) || this.bindings[action].some((code) => this.pressed.has(code)));
  }

  public consumePress(action: InputAction): boolean {
    if (!this.gameplayActive) return false;
    const expires = this.virtualPressed.get(action);
    if (expires !== undefined) {
      this.virtualPressed.delete(action);
      if (expires > performance.now()) return true;
    }
    const code = this.bindings[action].find((candidate) => this.justPressed.has(candidate));
    if (code === undefined) return false;
    this.justPressed.delete(code);
    return true;
  }

  public destroy(): void {
    this.eventTarget.removeEventListener('keydown', this.onKeyDown as EventListener);
    this.eventTarget.removeEventListener('keyup', this.onKeyUp as EventListener);
    this.pressed.clear();
    this.justPressed.clear();
    this.virtualDown.clear();
    this.virtualPressed.clear();
    this.activeListeners.clear();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.gameplayActive) return;
    if (!event.repeat) this.justPressed.add(event.code);
    this.pressed.add(event.code);
    const action = this.actionForCode(event.code);
    if (action !== undefined && PREVENT_DEFAULT_ACTIONS.has(action)) event.preventDefault();
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
    this.justPressed.delete(event.code);
  };

  private actionForCode(code: string): InputAction | undefined {
    return (Object.keys(this.bindings) as InputAction[]).find((action) =>
      this.bindings[action].includes(code),
    );
  }
}
