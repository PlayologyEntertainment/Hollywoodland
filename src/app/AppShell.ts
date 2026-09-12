import type { GameSettings } from '../settings/Settings';
import { assertElement } from '../shared/assert';

interface AppShellOptions {
  readonly settings: GameSettings;
  readonly onSettingsChanged: (settings: GameSettings) => void;
  readonly onStart: () => void;
  readonly onStop: () => void;
}

export class AppShell {
  private settings: GameSettings;

  public constructor(private readonly options: AppShellOptions) {
    this.settings = options.settings;
  }

  public mount(): void {
    this.applySettings(this.settings);

    const titlePanel = assertElement('#title-panel', HTMLElement);
    const playHud = assertElement('#play-hud', HTMLElement);
    const newCareer = assertElement('#new-career', HTMLButtonElement);
    const returnMenu = assertElement('#return-menu', HTMLButtonElement);
    const settingsDialog = assertElement('#settings-dialog', HTMLDialogElement);
    const statusButton = assertElement('#status-button', HTMLButtonElement);
    const statusPanel = assertElement('#status-panel', HTMLElement);
    const closeStatus = assertElement('#close-status', HTMLButtonElement);

    newCareer.addEventListener('click', () => {
      titlePanel.hidden = true;
      playHud.hidden = false;
      this.options.onStart();
      this.announce('Foundation scene started. Use A and D or the arrow keys to move.');
    });

    returnMenu.addEventListener('click', () => {
      playHud.hidden = true;
      titlePanel.hidden = false;
      this.options.onStop();
      newCareer.focus();
    });

    assertElement('#open-settings', HTMLButtonElement).addEventListener('click', () => {
      this.populateSettingsForm();
      settingsDialog.showModal();
    });

    settingsDialog.addEventListener('close', () => {
      if (settingsDialog.returnValue === 'confirm') {
        this.settings = this.readSettingsForm();
        this.applySettings(this.settings);
        this.options.onSettingsChanged(this.settings);
        this.announce('Settings saved.');
      }
    });

    assertElement('#text-scale', HTMLInputElement).addEventListener('input', (event) => {
      const input = event.currentTarget as HTMLInputElement;
      assertElement('#text-scale-output', HTMLOutputElement).value = `${input.value}%`;
    });

    statusButton.addEventListener('click', () => this.openStatus(statusPanel, statusButton));
    closeStatus.addEventListener('click', () => this.closeStatus(statusPanel, statusButton));
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
    assertElement('#analytics-enabled', HTMLInputElement).checked = this.settings.analyticsEnabled;
  }

  private readSettingsForm(): GameSettings {
    return {
      textScale: Number(assertElement('#text-scale', HTMLInputElement).value) / 100,
      highContrast: assertElement('#high-contrast', HTMLInputElement).checked,
      reducedMotion: assertElement('#reduced-motion', HTMLInputElement).checked,
      analyticsEnabled: assertElement('#analytics-enabled', HTMLInputElement).checked,
    };
  }

  private applySettings(settings: GameSettings): void {
    document.documentElement.style.setProperty('--text-scale', String(settings.textScale));
    document.body.classList.toggle('high-contrast', settings.highContrast);
    document.body.classList.toggle('reduced-motion', settings.reducedMotion);
  }

  private announce(message: string): void {
    assertElement('#announcer', HTMLElement).textContent = message;
  }
}
