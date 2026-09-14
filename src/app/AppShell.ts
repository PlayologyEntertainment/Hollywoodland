import type Phaser from 'phaser';

import type { GameSettings } from '../settings/Settings';
import { assertElement } from '../shared/assert';

export interface PlayState {
  readonly playerX: number;
  readonly discoveredCastingOffice: boolean;
}

interface AppShellOptions {
  readonly settings: GameSettings;
  readonly onSettingsChanged: (settings: GameSettings) => void;
  /** Creates the Phaser game on first call (deferred until the player
   * actually enters play) and reuses it on subsequent calls. */
  readonly onStart: (state?: PlayState) => Phaser.Game;
  readonly onStop: () => void;
  readonly onSave: () => Promise<void>;
  readonly onLoad: () => Promise<PlayState | undefined>;
  readonly onExport: () => string;
  readonly onImport: (raw: string) => Promise<PlayState>;
}

export class AppShell {
  private settings: GameSettings;
  private fpsTimer = 0;
  private game: Phaser.Game | undefined;

  public constructor(private readonly options: AppShellOptions) {
    this.settings = options.settings;
  }

  public mount(): void {
    this.applySettings(this.settings);
    const titlePanel = assertElement('#title-panel', HTMLElement);
    const playHud = assertElement('#play-hud', HTMLElement);
    const menuBackdrop = assertElement('#menu-backdrop', HTMLElement);
    const newCareer = assertElement('#new-career', HTMLButtonElement);
    const continueCareer = assertElement('#continue-career', HTMLButtonElement);
    const settingsDialog = assertElement('#settings-dialog', HTMLDialogElement);
    const statusButton = assertElement('#status-button', HTMLButtonElement);
    const statusPanel = assertElement('#status-panel', HTMLElement);
    const fileInput = assertElement('#save-file-input', HTMLInputElement);

    newCareer.addEventListener('click', () => this.startGame(titlePanel, playHud, menuBackdrop));
    continueCareer.addEventListener('click', async () => {
      const state = await this.options.onLoad();
      this.startGame(titlePanel, playHud, menuBackdrop, state);
      this.toast('Career restored');
    });
    assertElement('#return-menu', HTMLButtonElement).addEventListener('click', () => {
      playHud.hidden = true;
      titlePanel.hidden = false;
      menuBackdrop.hidden = false;
      this.options.onStop();
      newCareer.focus();
    });

    assertElement('#open-settings', HTMLButtonElement).addEventListener('click', () => {
      this.populateSettingsForm();
      settingsDialog.showModal();
    });
    settingsDialog.addEventListener('close', () => {
      if (settingsDialog.returnValue !== 'confirm') return;
      this.settings = this.readSettingsForm();
      this.applySettings(this.settings);
      this.options.onSettingsChanged(this.settings);
      this.toast('Settings saved');
    });
    assertElement('#text-scale', HTMLInputElement).addEventListener('input', (event) => {
      const input = event.currentTarget as HTMLInputElement;
      assertElement('#text-scale-output', HTMLOutputElement).value = `${input.value}%`;
    });

    statusButton.addEventListener('click', () => this.openStatus(statusPanel, statusButton));
    assertElement('#close-status', HTMLButtonElement).addEventListener('click', () => this.closeStatus(statusPanel, statusButton));
    assertElement('#film-mode', HTMLButtonElement).addEventListener('click', (event) => this.toggleFilmMode(event.currentTarget as HTMLButtonElement));
    assertElement('#fullscreen', HTMLButtonElement).addEventListener('click', () => void this.toggleFullscreen());
    assertElement('#manual-save', HTMLButtonElement).addEventListener('click', () => void this.save());
    assertElement('#export-save', HTMLButtonElement).addEventListener('click', () => this.exportSave());
    assertElement('#import-save', HTMLButtonElement).addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => void this.importSave(fileInput, titlePanel, playHud, menuBackdrop));
  }

  public async refreshContinue(): Promise<void> {
    try {
      assertElement('#continue-career', HTMLButtonElement).disabled = (await this.options.onLoad()) === undefined;
    } catch {
      assertElement('#continue-career', HTMLButtonElement).disabled = true;
    }
  }

  private startGame(titlePanel: HTMLElement, playHud: HTMLElement, menuBackdrop: HTMLElement, state?: PlayState): void {
    titlePanel.hidden = true;
    playHud.hidden = false;
    menuBackdrop.hidden = true;
    const isFirstStart = this.game === undefined;
    this.game = this.options.onStart(state);
    if (isFirstStart) this.bindGameEvents(this.game);
    this.announce('Hollywood Boulevard. Use A and D or arrow keys to move. Press E near the casting office.');
  }

  private bindGameEvents(game: Phaser.Game): void {
    game.events.on('interaction-proximity', (visible: boolean) => {
      assertElement('#interaction-prompt', HTMLElement).hidden = !visible;
    });
    game.events.on('casting-office-entered', () => {
      assertElement('#interaction-dialog', HTMLDialogElement).showModal();
      this.announce('You entered the Sunset Casting Exchange.');
    });
    this.startFpsMeter(game);
  }

  private async save(): Promise<void> {
    try {
      await this.options.onSave();
      await this.refreshContinue();
      this.toast('Career saved locally');
    } catch {
      this.toast('Save unavailable — export a copy instead');
    }
  }

  private exportSave(): void {
    const blob = new Blob([this.options.onExport()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hollywoodland-phase-1-save.json';
    anchor.click();
    URL.revokeObjectURL(url);
    this.toast('Save exported');
  }

  private async importSave(
    fileInput: HTMLInputElement,
    titlePanel: HTMLElement,
    playHud: HTMLElement,
    menuBackdrop: HTMLElement,
  ): Promise<void> {
    const file = fileInput.files?.[0];
    if (file === undefined) return;
    try {
      const state = await this.options.onImport(await file.text());
      await this.refreshContinue();
      this.startGame(titlePanel, playHud, menuBackdrop, state);
      this.toast('Save imported and verified');
    } catch (error) {
      this.toast(error instanceof Error ? error.message : 'Save import failed');
    } finally {
      fileInput.value = '';
    }
  }

  private toggleFilmMode(button: HTMLButtonElement): void {
    const active = !document.body.classList.contains('film-mode');
    document.body.classList.toggle('film-mode', active);
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? 'Return to Color' : 'Film Look';
    this.toast(active ? 'Black-and-white living-film treatment' : 'Hollywood color restored');
  }

  private async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement === null) await assertElement('#game-frame', HTMLElement).requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      this.toast('Fullscreen is unavailable in this browser');
    }
  }

  private startFpsMeter(game: Phaser.Game): void {
    window.setInterval(() => {
      const fps = Math.round(game.loop.actualFps);
      assertElement('#fps-output', HTMLOutputElement).value = `${Number.isFinite(fps) ? fps : '--'} FPS`;
    }, 500);
  }

  private openStatus(panel: HTMLElement, button: HTMLButtonElement): void {
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    assertElement('#close-status', HTMLButtonElement).focus();
  }

  private closeStatus(panel: HTMLElement, button: HTMLButtonElement): void {
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.focus();
  }

  private populateSettingsForm(): void {
    assertElement('#text-scale', HTMLInputElement).value = String(this.settings.textScale * 100);
    assertElement('#text-scale-output', HTMLOutputElement).value = `${this.settings.textScale * 100}%`;
    assertElement('#high-contrast', HTMLInputElement).checked = this.settings.highContrast;
    assertElement('#reduced-motion', HTMLInputElement).checked = this.settings.reducedMotion;
    assertElement('#film-effects', HTMLInputElement).checked = this.settings.filmEffects;
    assertElement('#analytics-enabled', HTMLInputElement).checked = this.settings.analyticsEnabled;
  }

  private readSettingsForm(): GameSettings {
    return {
      textScale: Number(assertElement('#text-scale', HTMLInputElement).value) / 100,
      highContrast: assertElement('#high-contrast', HTMLInputElement).checked,
      reducedMotion: assertElement('#reduced-motion', HTMLInputElement).checked,
      filmEffects: assertElement('#film-effects', HTMLInputElement).checked,
      analyticsEnabled: assertElement('#analytics-enabled', HTMLInputElement).checked,
    };
  }

  private applySettings(settings: GameSettings): void {
    document.documentElement.style.setProperty('--text-scale', String(settings.textScale));
    document.body.classList.toggle('high-contrast', settings.highContrast);
    document.body.classList.toggle('reduced-motion', settings.reducedMotion);
    document.body.classList.toggle('film-effects-off', !settings.filmEffects);
  }

  private toast(message: string): void {
    const toast = assertElement('#toast', HTMLElement);
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(this.fpsTimer);
    this.fpsTimer = window.setTimeout(() => { toast.hidden = true; }, 2400);
  }

  private announce(message: string): void {
    assertElement('#announcer', HTMLElement).textContent = message;
  }
}
