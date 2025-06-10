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
    // تأكد إن الـ base يطابق مسار المشروع على Vercel
    base: mode === 'production' ? '/Linkup-Ai-dash/' : '/', // غيّر حسب مسارك
    define: {
      'import.meta.env': env,
    },
  };
});
