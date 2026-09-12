import { defineConfig } from 'vite';

export default defineConfig({
  base: '/hollywoodland/',
  build: {
    target: 'es2022',
    sourcemap: true,
    assetsInlineLimit: 0,
    // Phaser is a single runtime dependency; track its gzip size in CI instead of
    // treating the uncompressed framework chunk as an application regression.
    chunkSizeWarningLimit: 1_500,
  },
  server: {
    host: '127.0.0.1',
  },
});
