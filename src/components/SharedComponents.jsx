/**
 * Topbar.jsx - Barra superior de la aplicacion
 * Muestra el titulo del modulo activo, notificaciones y chip de usuario
 *
 * Props:
 * - title: string - Titulo del modulo actual
 */

import { useAuth } from '../context/AuthContext.jsx'

function Topbar({ title }) {
  const { user } = useAuth()
  // Iniciales del usuario para el avatar
  const initials = user?.nombre?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'US'

  return (
    <header className="topbar">
      <h1 className="topbar__title">{title}</h1>
      <div className="topbar__actions">
        {/* Notificaciones */}
        <button
          className="btn btn--secondary btn--sm"
          aria-label="Notificaciones"
          style={{ padding: '8px', borderRadius: '8px' }}
        >
          🔔
        </button>
        {/* Chip de usuario con nombre y rol */}
        <div className="user-chip" role="status" aria-label={`Usuario: ${user?.nombre}`}>
          <div className="user-avatar" aria-hidden="true">{initials}</div>
          <span>{user?.nombre || 'Usuario'}</span>
          <span style={{ color: 'var(--gray-400)', fontSize: '10px' }}>▾</span>
        </div>
      </div>
    </header>
  )
}

export default Topbar


/**
 * Modal.jsx - Componente de ventana modal reutilizable
 * Soporta cierre por overlay, boton X y tecla Escape
 *
 * Props:
 * - isOpen: boolean - controla visibilidad
 * - onClose: function - callback al cerrar
 * - title: string - titulo del modal
 * - children: ReactNode - contenido del modal
 * - footer: ReactNode - botones del pie del modal
 */

import { useEffect } from 'react'

export function Modal({ isOpen, onClose, title, children, footer }) {
  // Cerrar con tecla Escape (accesibilidad)
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    // Overlay: clic fuera cierra el modal
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-title">{title}</h2>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  )
}


/**
 * Toast.jsx - Componente de notificacion flotante
 * Se auto-elimina despues de 2.8 segundos
 *
 * Props:
 * - message: string - mensaje a mostrar
 * - type: 'success' | 'error' - tipo de notificacion
 * - onClose: function - callback al cerrar
 */

import { useEffect } from 'react'

export function Toast({ message, type = 'success', onClose }) {
  // Auto-dismiss despues de 2800ms
  useEffect(() => {
    const timer = setTimeout(onClose, 2800)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`toast toast--${type}`}
      role="alert"
      aria-live="assertive"
    >
      <span aria-hidden="true">{type === 'success' ? '✓' : '⚠'}</span>
      {message}
    </div>
  )
}


/**
 * KPICard.jsx - Tarjeta de metrica clave del dashboard
 * Muestra un indicador con valor, label y badge de tendencia
 *
 * Props:
 * - label: string - nombre del indicador
 * - value: string | number - valor principal
 * - badge: string - texto del badge
 * - badgeType: 'green' | 'red' | 'yellow' | 'blue' - color del badge
 */

export function KPICard({ label, value, badge, badgeType = 'blue' }) {
  return (
    <div className="kpi-card">
      <span className="kpi-card__label">{label}</span>
      <span className="kpi-card__value">{value}</span>
      {badge && (
        <span className={`chip chip--${badgeType}`} aria-label={`Tendencia: ${badge}`}>
          {badge}
        </span>
      )}
    </div>
  )
}


/**
 * StatusChip.jsx - Badge de estado semantico
 * Mapea estados de facturas y clientes a colores
 *
 * Props:
 * - status: string - estado a mostrar
 */

const STATUS_MAP = {
  'Emitida': 'yellow',
  'Pagada':  'green',
  'Vencida': 'red',
  'Anulada': 'gray',
  'Activo':  'green',
  'Inactivo':'gray',
}

export function StatusChip({ status }) {
  const color = STATUS_MAP[status] || 'blue'
  return (
    <span className={`chip chip--${color}`}>
      {status}
    </span>
  )
}
