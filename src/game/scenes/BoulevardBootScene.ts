import Phaser from 'phaser';

import { DEFAULT_BOULEVARD_MANIFEST, isBoulevardManifest } from '../BoulevardManifest';
import { DEFAULT_WALK_CYCLE, isWalkCycle } from '../WalkCycle';

/** Loads data/boulevard-manifest.json before BoulevardSpikeScene starts, so
 * the manifest's plane/prop paths are known before that scene's own
 * preload() has to queue them — Phaser can't accept new load items once a
 * scene's preload phase has started, so the manifest has to arrive from an
 * earlier scene's preload instead. Registers the parsed (or, on a missing
 * or invalid file, default) manifest in the game registry and hands off.
 *
 * main.ts restarts this scene on every "New Career"/"Continue", not just
 * the tab's first boot, so an edit made through the Art Director tool
 * takes effect without a full page reload. That means preload() can run
 * more than once per page load — the cache key is regenerated each time
 * and the URL gets a cache-busting query param, so neither Phaser's JSON
 * cache nor the browser's HTTP cache can hand back a stale copy. */
export class BoulevardBootScene extends Phaser.Scene {
  private manifestCacheKey = '';
  private walkCycleCacheKey = '';

  public constructor() {
    super('BoulevardBootScene');
  }

  public preload(): void {
    this.manifestCacheKey = `boulevard-manifest-${Date.now()}`;
    this.load.json(
      this.manifestCacheKey,
      `${import.meta.env.BASE_URL}data/boulevard-manifest.json?t=${Date.now()}`,
    );
    // The walk-cycle numbers (frame size, stride, footprints) ship with the sheet.
    this.walkCycleCacheKey = `walk-cycle-${Date.now()}`;
    this.load.json(
      this.walkCycleCacheKey,
      `${import.meta.env.BASE_URL}data/walk-cycle.json?t=${Date.now()}`,
    );
  }

  public create(): void {
    const loaded: unknown = this.cache.json.get(this.manifestCacheKey);
    this.cache.json.remove(this.manifestCacheKey);
    const manifest = isBoulevardManifest(loaded) ? loaded : DEFAULT_BOULEVARD_MANIFEST;
    if (manifest !== loaded) {
      console.warn('[Boulevard] data/boulevard-manifest.json missing or invalid — using the built-in default layout.');
    }
    this.registry.set('boulevardManifest', manifest);

    const loadedCycle: unknown = this.cache.json.get(this.walkCycleCacheKey);
    this.cache.json.remove(this.walkCycleCacheKey);
    const walkCycle = isWalkCycle(loadedCycle) ? loadedCycle : DEFAULT_WALK_CYCLE;
    if (walkCycle !== loadedCycle) {
      console.warn('[Boulevard] data/walk-cycle.json missing or invalid — using the built-in walk cycle.');
    }
    this.registry.set('walkCycle', walkCycle);
    this.scene.start('BoulevardSpikeScene');
  }
}
