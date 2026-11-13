import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

export const USUARIOS = {
  admin: { id: 2, nombre: 'Admin Serviportenal', email: 'admin@serviportenal.com', rol: 'ADMIN_EMPRESA', empresaId: 1 },
  contador: { id: 3, nombre: 'Contador Serviportenal', email: 'contador@serviportenal.com', rol: 'CONTADOR', empresaId: 1 },
  general: { id: 1, nombre: 'Admin General', email: 'admin.general@invoixio.com', rol: 'ADMIN_GENERAL', empresaId: null },
}

/** Valor de sesion simulado, coherente con AuthProvider (mismos flags derivados del rol). */
export function authValue(usuario = USUARIOS.admin, extra = {}) {
  return {
    user: usuario,
    initializing: false,
    isAuthenticated: true,
    login: async () => usuario,
    logout: () => {},
    empresaId: usuario.empresaId ?? 1,
    empresas: [{ id: 1, nombre: 'Serviportenal SAS' }],
    cambiarEmpresa: () => {},
    esGeneral: usuario.rol === 'ADMIN_GENERAL',
    puedeEscribirMaestros: usuario.rol !== 'CONTADOR',
    puedeVerEmpleados: usuario.rol !== 'CONTADOR',
    ...extra,
  }
}

/**
 * Renderiza una pantalla con router en memoria y sesion simulada.
 * renderWithProviders(<ClientesPage />, { usuario: USUARIOS.contador, route: '/clientes' })
 */
export function renderWithProviders(ui, { usuario = USUARIOS.admin, route = '/', auth = {} } = {}) {
  return render(
    <AuthContext.Provider value={authValue(usuario, auth)}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthContext.Provider>,
  )
}
