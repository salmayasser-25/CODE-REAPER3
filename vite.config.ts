import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio to prevent WebSocket errors in middleware mode.
      hmr: false as const,
      ws: false as const,
      watch: null,
      allowedHosts: true as const,
    },
    optimizeDeps: {
      entries: ['index.html', 'src/main.tsx'],
    },
  };
});
