export type InputAction = 'moveLeft' | 'moveRight' | 'interact' | 'journal' | 'pause';
export type InputBindings = Readonly<Record<InputAction, readonly string[]>>;

export const DEFAULT_BINDINGS: InputBindings = Object.freeze({
  moveLeft: ['ArrowLeft', 'KeyA'],
  moveRight: ['ArrowRight', 'KeyD'],
  interact: ['Enter', 'KeyE'],
  journal: ['KeyJ'],
  pause: ['Escape'],
});

const PREVENT_DEFAULT_ACTIONS = new Set<InputAction>(['moveLeft', 'moveRight', 'interact']);

export class InputController {
  private readonly pressed = new Set<string>();
  private readonly justPressed = new Set<string>();
  private gameplayActive = false;
  /** Actions held by on-screen touch controls, which behave exactly like held keys. */
  private readonly virtualDown = new Set<InputAction>();
  private readonly virtualPressed = new Set<InputAction>();
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
      this.virtualPressed.delete(action);
      return;
    }
    if (!this.gameplayActive || this.virtualDown.has(action)) return;
    this.virtualDown.add(action);
    this.virtualPressed.add(action);
  }

  public isDown(action: InputAction): boolean {
    return this.gameplayActive && (this.virtualDown.has(action) || this.bindings[action].some((code) => this.pressed.has(code)));
  }

  public consumePress(action: InputAction): boolean {
    if (!this.gameplayActive) return false;
    if (this.virtualPressed.delete(action)) return true;
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
