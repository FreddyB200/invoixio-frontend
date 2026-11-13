/**
 * Topbar — editorial header with eyebrow, serif title, and date block.
 */

import { useAuth } from '../context/AuthContext.jsx'

const MONTHS = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']

function formatToday() {
  const d = new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const mon = MONTHS[d.getMonth()]
  const yr  = d.getFullYear()
  return { day, mon, yr }
}

function Topbar({ title, eyebrow = 'Sistema de Facturación' }) {
  const { esGeneral, empresas, empresaId, cambiarEmpresa } = useAuth()
  const { day, mon, yr } = formatToday()

  return (
    <header className="topbar">
      <span className="topbar__edge" aria-hidden="true" />
      <div className="topbar__left">
        <span className="topbar__eyebrow">{eyebrow}</span>
        <h1 className="topbar__title">{title}</h1>
      </div>
      <div className="topbar__actions">
        {esGeneral && (
          <label className="topbar__empresa">
            <span className="sr-only">Empresa activa</span>
            <select
              className="form-select"
              aria-label="Empresa activa"
              value={empresaId ?? ''}
              onChange={(e) => cambiarEmpresa(e.target.value)}
            >
              {empresas.length === 0 && <option value="">Sin empresas</option>}
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </label>
        )}
        <div className="topbar__date" aria-label="Fecha actual">
          <strong>{day} {mon}</strong><br />
          {yr}
        </div>
      </div>
    </header>
  )
}

export default Topbar
