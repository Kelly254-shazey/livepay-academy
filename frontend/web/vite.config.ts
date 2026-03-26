import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const projectRoot = fileURLToPath(new URL('.', import.meta.url));
  const env = loadEnv(mode, projectRoot, '');
  const apiBaseUrl = (env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  const socketUrl = (env.VITE_SOCKET_URL ?? '').replace(/\/$/, '');
  const googleClientId = env.VITE_GOOGLE_CLIENT_ID ?? '';
  const apiProxyTarget = apiBaseUrl.startsWith('http')
    ? new URL(apiBaseUrl).origin
    : 'http://localhost:3000';
  const socketProxyTarget = socketUrl || apiProxyTarget;

  return {
    plugins: [react()],
    define: {
      __LIVEGATE_API_BASE_URL__: JSON.stringify(apiBaseUrl),
      __LIVEGATE_SOCKET_URL__: JSON.stringify(socketUrl),
      __LIVEGATE_GOOGLE_CLIENT_ID__: JSON.stringify(googleClientId),
    },
    server: {
      hmr: {
        host: 'localhost',
        port: 5173,
        protocol: 'ws',
      },
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: socketProxyTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
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
  };
});
