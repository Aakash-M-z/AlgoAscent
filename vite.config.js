import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND_PORT = process.env.BACKEND_PORT || '3001';
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    strictPort: true,
    host: 'localhost',   // bind to localhost — fixes HMR WS connecting to wrong host
    hmr: {
      // Explicitly tell the browser where to connect for HMR
      host: 'localhost',
      port: 5000,
      protocol: 'ws',
    },
    headers: {
      // Required for Google OAuth popup — allows window.closed polling across origins
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            const isRefused = err.code === 'ECONNREFUSED';
            const msg = isRefused
              ? `Backend not running on port ${BACKEND_PORT}. Run: npm run server`
              : `Proxy error (${err.code}): ${err.message}`;
            console.error('\n[vite proxy] ❌', msg, '\n');
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: msg, code: err.code }));
            }
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
