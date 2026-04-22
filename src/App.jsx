/**
 * App.jsx - Componente raiz y configuracion de rutas de Invoixio
 * Utiliza React Router v6 para navegacion SPA
 * Aplica proteccion de rutas mediante PrivateRoute
 */

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import FacturasPage from './pages/FacturasPage.jsx'
import ClientesPage from './pages/ClientesPage.jsx'
import InventarioPage from './pages/InventarioPage.jsx'

/**
 * Componente principal App
 * Define el arbol de rutas de la aplicacion
 * Las rutas privadas requieren autenticacion previa
 */
function App() {
  return (
    // AuthProvider provee el contexto de autenticacion a toda la app
    <AuthProvider>
      <Routes>
        {/* Ruta publica: pantalla de login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Rutas privadas: requieren sesion activa */}
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardPage /></PrivateRoute>
        } />
        <Route path="/facturas" element={
          <PrivateRoute><FacturasPage /></PrivateRoute>
        } />
        <Route path="/clientes" element={
          <PrivateRoute><ClientesPage /></PrivateRoute>
        } />
        <Route path="/inventario" element={
          <PrivateRoute><InventarioPage /></PrivateRoute>
        } />

        {/* Redireccion por defecto al dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
