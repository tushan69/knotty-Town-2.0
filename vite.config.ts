import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.resolve(__dirname);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '');
  const geminiKey = (env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '').trim();
  return {
    root: rootDir,
    envDir: rootDir,
    /** Expose GEMINI_* from .env to import.meta.env (same rules as VITE_*). */
    envPrefix: ['VITE_', 'GEMINI_'],
    base: '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    build: {
      cssCodeSplit: true,
    },
    define: {
      'process.env.API_KEY': JSON.stringify(geminiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
      // Ensures client code reading import.meta.env.GEMINI_API_KEY matches loadEnv (same as .env / .env.local).
      'import.meta.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
