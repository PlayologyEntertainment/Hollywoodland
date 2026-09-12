import { defineConfig } from 'vite';

export default defineConfig({
  base: '/hollywoodland/',
  build: {
    target: 'es2022',
    sourcemap: true,
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1_500,
  },
  server: { host: '127.0.0.1' },
});
