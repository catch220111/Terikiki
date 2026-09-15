import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** GitHub Pages project site: https://catch220111.github.io/Terikiki/ */
export const GITHUB_PAGES_BASE = '/Terikiki/';

export default defineConfig({
  base: GITHUB_PAGES_BASE,
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5174 },
  preview: { host: '127.0.0.1', port: 4173 },
  optimizeDeps: { include: ['pdfjs-dist'] },
});
