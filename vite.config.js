import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy de desarrollo: el front llama a /api y Vite lo reenvia al backend Spring Boot (evita CORS).
// Para apuntar a otro backend: VITE_API_PROXY=http://host:puerto npm run dev
const API = process.env.VITE_API_PROXY || 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: API,
        changeOrigin: true,
        // El navegador habla con Vite (mismo origen); sin Origin el backend no aplica CORS,
        // asi el login funciona aunque Vite use otro puerto (3001, 5174...).
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
  },
})
