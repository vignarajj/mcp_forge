/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { mcpApiPlugin } from './mcpApiPlugin';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), mcpApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    // In CLI mode, vite preview runs on port 4173 and the standalone
    // API server runs on port 4174. Proxy /api/* so relative URLs work.
    preview: {
      proxy: {
        '/api': {
          target: 'http://localhost:4174',
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      globals: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['src/main.tsx', 'src/types.ts', 'src/vite-env.d.ts'],
      },
    },
  };
});
