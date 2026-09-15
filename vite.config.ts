import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages project site: https://catch220111.github.io/Terikiki/
  base: '/Terikiki/',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5174 },
  optimizeDeps: { include: ['pdfjs-dist'] },
});
