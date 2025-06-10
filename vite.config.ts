import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    base: mode === 'production' ? '/Linkup-Ai-dash/' : '/',
    define: {
      'import.meta.env': env,
    },
  };
});
