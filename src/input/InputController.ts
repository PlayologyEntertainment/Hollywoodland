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
  private gameplayActive = false;

  public constructor(
    private readonly eventTarget: Pick<Window, 'addEventListener' | 'removeEventListener'>,
    private bindings: InputBindings = DEFAULT_BINDINGS,
  ) {
    this.eventTarget.addEventListener('keydown', this.onKeyDown as EventListener);
    this.eventTarget.addEventListener('keyup', this.onKeyUp as EventListener);
  }

  public setGameplayActive(active: boolean): void {
    this.gameplayActive = active;
    if (!active) this.pressed.clear();
  }

  public setBindings(bindings: InputBindings): void {
    this.bindings = bindings;
    this.pressed.clear();
  }

  public isDown(action: InputAction): boolean {
    return this.gameplayActive && this.bindings[action].some((code) => this.pressed.has(code));
  }

  public destroy(): void {
    this.eventTarget.removeEventListener('keydown', this.onKeyDown as EventListener);
    this.eventTarget.removeEventListener('keyup', this.onKeyUp as EventListener);
    this.pressed.clear();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.gameplayActive) return;
    this.pressed.add(event.code);
    const action = this.actionForCode(event.code);
    if (action !== undefined && PREVENT_DEFAULT_ACTIONS.has(action)) event.preventDefault();
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressed.delete(event.code);
  };

  private actionForCode(code: string): InputAction | undefined {
    return (Object.keys(this.bindings) as InputAction[]).find((action) =>
      this.bindings[action].includes(code),
    );
  }
}
