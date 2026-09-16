import Phaser from 'phaser';

import { DEFAULT_BOULEVARD_MANIFEST, isBoulevardManifest } from '../BoulevardManifest';

const MANIFEST_KEY = 'boulevard-manifest';

/** Loads data/boulevard-manifest.json before BoulevardSpikeScene starts, so
 * the manifest's plane/prop paths are known before that scene's own
 * preload() has to queue them — Phaser can't accept new load items once a
 * scene's preload phase has started, so the manifest has to arrive from an
 * earlier scene's preload instead. Registers the parsed (or, on a missing
 * or invalid file, default) manifest in the game registry and hands off. */
export class BoulevardBootScene extends Phaser.Scene {
  public constructor() {
    super('BoulevardBootScene');
  }

  public preload(): void {
    this.load.json(MANIFEST_KEY, `${import.meta.env.BASE_URL}data/boulevard-manifest.json`);
  }

  public create(): void {
    const loaded: unknown = this.cache.json.get(MANIFEST_KEY);
    const manifest = isBoulevardManifest(loaded) ? loaded : DEFAULT_BOULEVARD_MANIFEST;
    if (manifest !== loaded) {
      console.warn('[Boulevard] data/boulevard-manifest.json missing or invalid — using the built-in default layout.');
    }
    this.registry.set('boulevardManifest', manifest);
    this.scene.start('BoulevardSpikeScene');
  }
}
