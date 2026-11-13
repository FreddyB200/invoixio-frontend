/**
 * PrivateRoute.jsx - Ruta protegida: espera a restaurar la sesion y redirige al login si no hay usuario.
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { LoadingState } from './StateViews.jsx'

function PrivateRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth()
  if (initializing) return <LoadingState label="Restaurando sesión…" />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default PrivateRoute
