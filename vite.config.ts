import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { hintPlugin } from './server/hintPlugin';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  return {
    base: '/review-loop/',
    plugins: [react(), hintPlugin(env)],
    test: { environment: 'node', include: ['tests/**/*.test.ts'] },
  };
});
