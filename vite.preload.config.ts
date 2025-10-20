import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    target: 'chrome114',
    rollupOptions: {
      external: ['electron'],
      output: {
        format: 'cjs'
      }
    }
  }
});
