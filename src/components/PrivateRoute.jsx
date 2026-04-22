/**
 * PrivateRoute.jsx - Componente de ruta protegida
 * Redirige al login si el usuario no esta autenticado
 * Patron: Higher Order Component (HOC) de proteccion
 */

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()
  // Si no esta autenticado, redirigir al login
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default PrivateRoute
