import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this repo from /ts-dojo/. Routing is hash-based, so this
  // only needs to be right for asset URLs.
  base: '/ts-dojo/',
  build: {
    // The TypeScript services bundle Monaco ships is ~9MB on its own; the default
    // 500kB warning is pure noise here.
    chunkSizeWarningLimit: 12_000,
  },
});
