/**
 * main.jsx - Punto de entrada principal de la aplicacion Invoixio
 * Proyecto Formativo: Sistema de Gestion y Facturacion Electronica
 * Aprendiz: Freddy Johan Bautista Baquero
 * Ficha: 3186632 | SENA | Abril 2026
 * GitHub: https://github.com/FreddyB200/invoixio-frontend
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/global.css'

// Montar la aplicacion React en el elemento root del DOM
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
