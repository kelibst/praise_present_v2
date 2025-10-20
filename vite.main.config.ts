import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    browserField: false,
    conditions: ['node'],
    mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
  },
  build: {
    target: 'node18',
    rollupOptions: {
      external: [
        '@prisma/client',
        'sqlite3',
        'electron',
        'electron-squirrel-startup',
        'fs',
        'path',
        'crypto',
        'os',
        'child_process',
        'url',
        'util',
        'stream',
        'events',
        'buffer',
        'querystring',
        'zlib',
        'http',
        'https',
        'net',
        'tls',
        'dgram',
        'dns',
        'readline',
        'vm',
        'worker_threads'
      ],
      output: {
        format: 'cjs'
      }
    }
  }
});
