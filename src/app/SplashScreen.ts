import { assertElement } from '../shared/assert';

/** Matches .splash-screen.fade-out's transition-duration in styles.css. */
const FADE_OUT_MS = 550;

/** Delay before the fade-out starts, giving .splash-art's zoom animation
 * room to read before the screen unmounts. */
const ZOOM_MS = 700;

/**
 * The studio-logo-style splash shown before the Main Menu: Playology
 * medallion → "Presents" → the Hollywoodland splash art → an Enter button.
 * Clicking Enter zooms the splash art while the medallion/presents/button
 * drop away, then fades the whole screen out to reveal the Main Menu
 * underneath.
 */
export class SplashScreen {
  public mount(): void {
    const splash = assertElement('#splash-screen', HTMLElement);
    const enterButton = assertElement('#splash-enter', HTMLButtonElement);
    enterButton.addEventListener('click', () => {
      enterButton.disabled = true;
      splash.classList.add('activated');
      window.setTimeout(() => splash.classList.add('fade-out'), ZOOM_MS);
      window.setTimeout(() => {
        splash.hidden = true;
        assertElement('#new-career', HTMLButtonElement).focus();
      }, ZOOM_MS + FADE_OUT_MS);
    });
  }
}
