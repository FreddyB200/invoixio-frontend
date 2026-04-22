/**
 * AuthContext.jsx - Contexto global de autenticacion
 * Maneja el estado de sesion del usuario en toda la aplicacion
 * Utiliza React Context API + useState para estado global sin Redux
 */

import { createContext, useContext, useState } from 'react'

// Crear el contexto de autenticacion
const AuthContext = createContext(null)

/**
 * Usuarios de demostracion del sistema
 * En produccion, estos datos vendrian del backend Spring Boot
 */
const DEMO_USERS = [
  { id: 1, email: 'admin@invoixio.com', password: 'admin123', nombre: 'Administrador', rol: 'ADMIN' },
  { id: 2, email: 'contador@invoixio.com', password: 'conta123', nombre: 'Contador', rol: 'CONTADOR' },
]

/**
 * AuthProvider - Proveedor del contexto de autenticacion
 * Envuelve toda la aplicacion para dar acceso al estado de sesion
 * @param {React.ReactNode} children - Componentes hijos
 */
export function AuthProvider({ children }) {
  // Estado del usuario autenticado (null = no autenticado)
  const [user, setUser] = useState(null)

  /**
   * login - Autentica al usuario con email y password
   * @param {string} email - Correo electronico
   * @param {string} password - Contrasena
   * @returns {boolean} true si las credenciales son correctas
   */
  const login = (email, password) => {
    const found = DEMO_USERS.find(u => u.email === email && u.password === password)
    if (found) {
      // Guardar usuario en estado (sin exponer la contrasena)
      const { password: _, ...safeUser } = found
      setUser(safeUser)
      return true
    }
    return false
  }

  /**
   * logout - Cierra la sesion del usuario actual
   * Limpia el estado de usuario
   */
  const logout = () => {
    setUser(null)
  }

  // Valor expuesto por el contexto a toda la aplicacion
  const value = { user, login, logout, isAuthenticated: !!user }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth - Hook personalizado para acceder al contexto de autenticacion
 * @returns {Object} { user, login, logout, isAuthenticated }
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
