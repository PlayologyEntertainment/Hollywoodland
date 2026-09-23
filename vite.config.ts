import { defineConfig } from 'vite';

export default defineConfig({
  // The live site serves the game from a case-sensitive /Hollywoodland/ folder on Hostinger.
  base: '/Hollywoodland/',
  build: {
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1_500,
  },
  server: { host: '127.0.0.1' },
});
