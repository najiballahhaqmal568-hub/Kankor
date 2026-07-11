import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// فاز ۷: vite-plugin-pwa اینجا اضافه می‌شود
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
