/**
 * Sidebar — ink column navigation with serif wordmark.
 */

import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Icon from './Icon.jsx'

const NAV_ITEMS = [
  { path: '/dashboard', icon: 'dashboard', label: 'Resumen',            num: 'I'   },
  { path: '/facturas',  icon: 'document',  label: 'Facturación',        num: 'II'  },
  { path: '/cartera',   icon: 'warning',   label: 'Cartera vencida',    num: 'III' },
  { path: '/clientes',  icon: 'users',     label: 'Clientes',           num: 'IV'  },
  { path: '/grupos',    icon: 'box',       label: 'Grupos',             num: 'V'   },
  { path: '/servicios', icon: 'package',   label: 'Servicios y tarifas', num: 'VI'  },
  { path: '/empleados', icon: 'lock',      label: 'Empleados',          num: 'VII', soloAdmins: true },
]

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user, puedeVerEmpleados } = useAuth()

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
          <span className="sidebar__mark">Invoixio</span>
        </div>
        <span className="sidebar__meta">Gestión y facturación</span>
      </div>

      <nav className="sidebar__nav" aria-label="Menú principal">
        <span className="nav-label">Módulos</span>

        {NAV_ITEMS.filter(item => !item.soloAdmins || puedeVerEmpleados).map(item => {
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

      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar" aria-hidden="true">{initials}</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user?.nombre || 'Usuario'}</div>
            <div className="sidebar__user-role">{(user?.rol || '').replaceAll('_', ' ').toLowerCase()}</div>
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
