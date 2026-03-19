import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiBaseUrl = (process.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const socketUrl = (process.env.VITE_SOCKET_URL ?? '').replace(/\/$/, '');

export default defineConfig({
  plugins: [react()],
  define: {
    __LIVEGATE_API_BASE_URL__: JSON.stringify(apiBaseUrl),
    __LIVEGATE_SOCKET_URL__: JSON.stringify(socketUrl),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['zustand/middleware', 'react-router-dom', 'socket.io-client'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});
