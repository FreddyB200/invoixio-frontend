/**
 * Topbar — editorial header with eyebrow, serif title, and date block.
 */

import { useAuth } from '../context/AuthContext.jsx'
import Icon from './Icon.jsx'

const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

function formatToday() {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const mon = MONTHS[d.getMonth()]
  const yr  = d.getFullYear()
  return { day, mon, yr }
}

function Topbar({ title, eyebrow = 'Sistema de Facturación' }) {
  const { user } = useAuth()
  const { day, mon, yr } = formatToday()

  return (
    <header className="topbar">
      <span className="topbar__edge" aria-hidden="true" />
      <div className="topbar__left">
        <span className="topbar__eyebrow">{eyebrow}</span>
        <h1 className="topbar__title">{title}</h1>
      </div>
      <div className="topbar__actions">
        <button
          type="button"
          className="icon-btn"
          aria-label="Notificaciones"
        >
          <Icon name="bell" size={15} />
          <span className="icon-btn__dot" aria-hidden="true" />
        </button>

        <div className="topbar__date" aria-label="Fecha actual">
          <strong>{day} {mon}</strong><br />
          {yr} · Vol. I
        </div>
      </div>
    </header>
  )
}

export default Topbar
