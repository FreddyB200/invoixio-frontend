import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuracion de Vite para proyecto Invoixio
// Aprendiz: Freddy Johan Bautista Baquero - Ficha 3186632
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
