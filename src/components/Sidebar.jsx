/**
 * Sidebar.jsx - Barra de navegacion lateral persistente
 * Muestra los modulos del sistema con el item activo resaltado
 * Maneja el logout mediante el contexto de autenticacion
 *
 * Props:
 * - activeModule: string - modulo actualmente activo
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Definicion de los items del menu de navegacion
const NAV_ITEMS = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/facturas',  icon: '📄', label: 'Facturacion' },
  { path: '/clientes',  icon: '👥', label: 'Clientes' },
  { path: '/inventario',icon: '📦', label: 'Inventario' },
]

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()

  // Cerrar sesion y redirigir al login
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Marca del sistema */}
      <div className="sidebar__brand">
        <div className="sidebar__icon">🧾</div>
        <span className="sidebar__name">Invoixio</span>
      </div>

      {/* Navegacion principal */}
      <nav className="sidebar__nav" aria-label="Menu principal">
        <span className="nav-label">Principal</span>

        {NAV_ITEMS.map(item => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'nav-item--active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-current={location.pathname === item.path ? 'page' : undefined}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <span className="nav-label" style={{ marginTop: '8px' }}>Sistema</span>
        <button className="nav-item">
          <span aria-hidden="true">⚙️</span> Configuracion
        </button>
      </nav>

      {/* Footer del sidebar con logout */}
      <div className="sidebar__footer">
        <button className="nav-item" onClick={handleLogout}>
          <span aria-hidden="true">🚪</span> Cerrar sesion
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
