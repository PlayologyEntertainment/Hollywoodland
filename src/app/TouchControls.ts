import type { DomainEventBus } from '../domain/DomainEventBus';
import type { InputController } from '../input/InputController';

/** Which way a drag on the walking pad means, from how far the finger is from the pad's middle: nothing inside the dead zone. */
export function padDirection(offset: number, deadZone: number): -1 | 0 | 1 {
  if (offset <= -deadZone) return -1;
  if (offset >= deadZone) return 1;
  return 0;
}

export interface TouchControlsOptions {
  /** The container holding the pad and the Interact button (see index.html). Shown only while the player can walk. */
  readonly root: HTMLElement;
  readonly input: InputController;
  readonly domainEvents: DomainEventBus;
}

/** On-screen controls for a touch device: a pad at the bottom left to slide left and right to walk, and a button at the bottom right
 * that appears when there is something to enter and says what. They press the same virtual keys the keyboard does, so the game
 * needs to know nothing about them. They step aside whenever gameplay is switched off (a dialog, the menu) or the Career panel is
 * open. Whether they show at all on a given device is the stylesheet's call (`.touch`). */
export class TouchControls {
  private readonly pad: HTMLElement;
  private readonly knob: HTMLElement;
  private readonly interact: HTMLButtonElement;
  private gameplayActive = false;
  private panelOpen = false;
  private padPointer: number | undefined;

  public constructor(private readonly options: TouchControlsOptions) {
    const { root } = options;
    this.pad = this.find(root, '.touch-pad');
    this.knob = this.find(root, '.touch-knob');
    this.interact = this.find(root, '.touch-interact') as HTMLButtonElement;

    this.pad.addEventListener('pointerdown', (event) => {
      if (this.padPointer !== undefined) return;
      this.padPointer = event.pointerId;
      this.pad.setPointerCapture(event.pointerId);
      this.steer(event.clientX);
    });
    this.pad.addEventListener('pointermove', (event) => {
      if (event.pointerId === this.padPointer) this.steer(event.clientX);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
      this.pad.addEventListener(type, (event) => {
        if (event.pointerId === this.padPointer) this.releasePad();
      });
    }

    this.interact.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.interact.setPointerCapture(event.pointerId);
      options.input.setVirtualDown('interact', true);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
      this.interact.addEventListener(type, () => options.input.setVirtualDown('interact', false));
    }
    // Shut away from the context menu a long press would otherwise raise.
    root.addEventListener('contextmenu', (event) => event.preventDefault());

    options.input.onGameplayActiveChange((active) => {
      this.gameplayActive = active;
      if (!active) this.releasePad();
      this.paint();
    });
    options.domainEvents.on('status-panel-visibility-changed', ({ open }) => {
      this.panelOpen = open;
      if (open) this.releasePad();
      this.paint();
    });
    options.domainEvents.on('interaction-proximity-changed', ({ visible, label }) => {
      this.interact.hidden = !visible;
      if (visible) {
        this.interact.textContent = label;
        this.interact.setAttribute('aria-label', label);
      }
    });
    this.paint();
  }

  private find(root: HTMLElement, selector: string): HTMLElement {
    const element = root.querySelector<HTMLElement>(selector);
    if (element === null) throw new Error(`Touch controls are missing ${selector}`);
    return element;
  }

  private paint(): void {
    this.options.root.hidden = !this.gameplayActive || this.panelOpen;
  }

  private steer(clientX: number): void {
    const rect = this.pad.getBoundingClientRect();
    const offset = clientX - (rect.left + rect.width / 2);
    const direction = padDirection(offset, rect.width * 0.12);
    this.options.input.setVirtualDown('moveLeft', direction === -1);
    this.options.input.setVirtualDown('moveRight', direction === 1);
    const reach = Math.max(0, rect.width / 2 - this.knob.offsetWidth / 2 - 4);
    this.knob.style.transform = `translateX(${Math.max(-reach, Math.min(reach, offset))}px)`;
  }

  private releasePad(): void {
    this.padPointer = undefined;
    this.options.input.setVirtualDown('moveLeft', false);
    this.options.input.setVirtualDown('moveRight', false);
    this.knob.style.transform = '';
  }
}
