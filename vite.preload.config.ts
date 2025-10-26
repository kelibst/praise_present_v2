import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    target: 'chrome114',
    sourcemap: false,  // Disable source maps for smaller bundle
    minify: 'terser',  // Enable minification
    rollupOptions: {
      external: ['electron'],
      output: {
        format: 'cjs'
      }
    }
  }
});
