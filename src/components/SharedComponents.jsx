import { useEffect } from 'react'
import Icon from './Icon.jsx'

/**
 * Modal — overlay dialog with an oxblood top-rule accent.
 */
export function Modal({ isOpen, onClose, title, eyebrow, children, footer }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal">
        <div className="modal__header">
          <div className="modal__title-wrap">
            {eyebrow && <span className="modal__eyebrow">{eyebrow}</span>}
            <h2 className="modal__title" id="modal-title">{title}</h2>
          </div>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  )
}


/**
 * Toast — dismissable notification, bottom-right.
 */
export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const label = type === 'success' ? 'OK' : 'ERR'

  return (
    <div
      className={`toast toast--${type}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="toast__mark">{label}</span>
      <span>{message}</span>
    </div>
  )
}


/**
 * KPICard — editorial metric tile with mono figure and trend line.
 *
 * Props:
 *  - label: small-caps label
 *  - value: primary figure (mono)
 *  - num: tiny reference number (e.g. "N° 01")
 *  - trend: { dir: 'up'|'down'|'warn'|'flat', text: '...' }
 *  - accent: 'ink'|'oxblood'|'moss'|'amber' — bottom rule color
 */
export function KPICard({ label, value, num, trend, accent = 'ink' }) {
  const accentClass = accent === 'oxblood'
    ? 'kpi-card--accent'
    : accent === 'moss' ? 'kpi-card--good'
    : accent === 'amber' ? 'kpi-card--warn'
    : ''

  return (
    <div className={`kpi-card ${accentClass}`}>
      <div className="kpi-card__head">
        <span className="kpi-card__label">{label}</span>
        {num && <span className="kpi-card__num">{num}</span>}
      </div>
      <span className="kpi-card__value">{value}</span>
      {trend && (
        <span className={`kpi-card__trend kpi-card__trend--${trend.dir || 'flat'}`}>
          {trend.dir === 'up' && <Icon name="arrow-up" size={11} />}
          {trend.dir === 'down' && <Icon name="arrow-down" size={11} />}
          {trend.dir === 'warn' && <Icon name="warning" size={11} />}
          {trend.text}
        </span>
      )}
      <span className="kpi-card__rule" aria-hidden="true" />
    </div>
  )
}


/**
 * StatusChip — compact status indicator.
 */
const STATUS_MAP = {
  'Emitida':  'yellow',
  'Pagada':   'green',
  'Vencida':  'red',
  'Anulada':  'gray',
  'Activo':   'green',
  'Inactivo': 'gray',
}

export function StatusChip({ status }) {
  const color = STATUS_MAP[status] || 'blue'
  return (
    <span className={`chip chip--${color}`}>
      {status}
    </span>
  )
}
