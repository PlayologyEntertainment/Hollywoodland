import type Phaser from 'phaser';

import { FpsMeter } from '../game/FpsMeter';
import { assertElement } from '../shared/assert';

/** The frames-per-second figure beside the footer's Wait button. It only measures while it is shown, so it costs nothing when
 * the Show frames per second setting is off. "FPS" is a unit, so it is not translated. */
export class FpsReadout {
  private readonly meter = new FpsMeter();
  private game: Phaser.Game | undefined;
  private visible = false;
  private readonly onPostRender = (): void => {
    const fps = this.meter.frame(performance.now());
    if (fps !== undefined) this.element().textContent = `${fps} FPS`;
  };

  /** Starts following a game's frames; call again with each new game. */
  public attach(game: Phaser.Game): void {
    this.detach();
    this.game = game;
    if (this.visible) this.listen();
  }

  public setVisible(visible: boolean): void {
    this.visible = visible;
    const element = this.element();
    element.hidden = !visible;
    if (!visible) {
      this.stopListening();
      element.textContent = '';
    } else {
      this.listen();
    }
  }

  private listen(): void {
    if (this.game === undefined) return;
    this.meter.reset();
    this.game.events.off('postrender', this.onPostRender);
    this.game.events.on('postrender', this.onPostRender);
  }

  private stopListening(): void {
    this.game?.events.off('postrender', this.onPostRender);
  }

  private detach(): void {
    this.stopListening();
    this.game = undefined;
  }

  private element(): HTMLElement {
    return assertElement('#fps-readout', HTMLElement);
  }
}
