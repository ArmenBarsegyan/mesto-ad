import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: false,
    host: true,
    port: 5173
  },
  base: './',
});