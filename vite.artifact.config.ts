import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * بیلد تک‌فایله برای انتشار به‌عنوان صفحه پیش‌نمایش (Artifact).
 * همه JS/CSS/فونت‌ها داخل یک index.html جاسازی می‌شود؛ بدون Service Worker.
 */
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-artifact',
    assetsInlineLimit: 100000000,
  },
});
