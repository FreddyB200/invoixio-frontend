/**
 * Sidebar — ink column navigation with serif wordmark.
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Icon from './Icon.jsx'

const NAV_ITEMS = [
  { path: '/dashboard',  icon: 'dashboard', label: 'Resumen',      num: 'I'   },
  { path: '/facturas',   icon: 'document',  label: 'Facturación',  num: 'II'  },
  { path: '/clientes',   icon: 'users',     label: 'Clientes',     num: 'III' },
  { path: '/inventario', icon: 'package',   label: 'Inventario',   num: 'IV'  },
]

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'US'

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-row">
          <span className="sidebar__mark">Invo<em>i</em>xio</span>
        </div>
        <span className="sidebar__meta">Est. MMXXVI · Bogotá</span>
      </div>

      <nav className="sidebar__nav" aria-label="Menú principal">
        <span className="nav-label">Módulos</span>

        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path
          return (
            <button
              key={item.path}
              className={`nav-item ${active ? 'nav-item--active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
            >
              <span className="nav-item__icon">
                <Icon name={item.icon} size={15} />
              </span>
              {item.label}
              <span className="nav-item__num">{item.num}</span>
            </button>
          )
        })}

        <span className="nav-label">Sistema</span>
        <button className="nav-item" type="button">
          <span className="nav-item__icon"><Icon name="settings" size={15} /></span>
          Preferencias
          <span className="nav-item__num">V</span>
        </button>
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar" aria-hidden="true">{initials}</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user?.nombre || 'Usuario'}</div>
            <div className="sidebar__user-role">{user?.rol || 'Administrador'}</div>
          </div>
        </div>
        <button className="sidebar__logout" onClick={handleLogout}>
          <Icon name="exit" size={12} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
