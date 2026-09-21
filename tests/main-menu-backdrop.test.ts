// @ts-expect-error Node's runtime module is available to Vitest; the browser build intentionally omits Node globals.
import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8') as string;

describe('main menu backdrop', () => {
  const backdrop = indexHtml.match(/<div id="menu-backdrop"[^>]*>/)?.[0] ?? '';
  const image = backdrop.match(/url\('%BASE_URL%([^']+)'\)/)?.[1] ?? '';

  it('is the soundstage art (art/Hollywoodland_Location_Soundstage.png, shipped as the soundstage location image)', () => {
    expect(image).toBe('assets/locations/soundstage.webp');
  });

  it('points at an image that is really in the build', () => {
    expect(existsSync(new URL(`../public/${image}`, import.meta.url))).toBe(true);
  });
});

describe('main menu buttons', () => {
  const menu = indexHtml.match(/<nav id="main-menu"[\s\S]*?<\/nav>/)?.[0] ?? '';

  it('reads Enter Hollywood, Continue, Save Options and Settings', () => {
    const labels = [...menu.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map((match) => match[1]);
    expect(labels).toEqual(['Enter Hollywood', 'Continue', 'Save Options', 'Settings']);
  });

  it('keeps the same buttons behind the new names, so the pages work as before', () => {
    expect(menu).toMatch(/id="import-save"[^>]*>Save Options</);
    expect(menu).toMatch(/id="open-settings"[^>]*>Settings</);
    // The pages themselves are unchanged until they are redesigned.
    expect(indexHtml).toContain('id="settings-dialog"');
    expect(indexHtml).toContain('id="save-file-input"');
  });
});

describe('the Playology logo', () => {
  it('is the approved Playology_Entertainment_Logo, shipped as a small transparent WebP, on the splash screen and in the footer', () => {
    const uses = [...indexHtml.matchAll(/<img class="(splash-medallion|footer-logo)"[^>]*src="([^"]+)"/g)].map((match) => [match[1], match[2]]);
    expect(uses).toEqual([
      ['splash-medallion', '/assets/ui/playology-logo.webp'],
      ['footer-logo', '/assets/ui/playology-logo.webp'],
    ]);
    expect(indexHtml).not.toContain('playology-logo.svg');
  });

  it('exists in the build, is small, and has an alpha channel', () => {
    const file = new URL('../public/assets/ui/playology-logo.webp', import.meta.url);
    expect(existsSync(file)).toBe(true);
    const bytes = readFileSync(file) as Uint8Array;
    expect(bytes.length).toBeLessThan(150_000);
    const ascii = (from: number, to: number): string => String.fromCharCode(...bytes.slice(from, to));
    expect(ascii(0, 4)).toBe('RIFF');
    expect(ascii(8, 12)).toBe('WEBP');
    // An extended WebP whose flags say it has transparency.
    expect(ascii(12, 16)).toBe('VP8X');
    expect((bytes[20] ?? 0) & 0x10).toBe(0x10);
  });

  it('has no outer glow: no drop-shadow or shadow filter on either logo', () => {
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8') as string;
    for (const selector of ['.splash-medallion', '.footer-logo']) {
      const block = css.match(new RegExp(`\n${selector.replace('.', '\.')} \{([^}]*)\}`))?.[1] ?? '';
      expect(block, selector).not.toBe('');
      expect(block, selector).not.toMatch(/filter|drop-shadow|box-shadow|text-shadow/);
    }
  });

  it('keeps its old sizes: 88px tall on the splash screen and 2.6rem tall in the footer, width following', () => {
    const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8') as string;
    expect(css).toMatch(/\.splash-medallion \{[^}]*height: 88px; width: auto;/);
    expect(css).toContain('.footer-logo { display: block; width: auto; height: 2.6rem; }');
  });
});
