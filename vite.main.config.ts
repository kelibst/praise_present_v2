import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        '@prisma/client',
        'sqlite3',
        'electron',
        'electron-squirrel-startup'
      ]
    }
  }
});
