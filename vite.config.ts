import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Using relative paths ensures compatibility with GitHub Pages (repo subpath) and custom domains
  server: {
    host: true,
    port: 5173
  }
});
