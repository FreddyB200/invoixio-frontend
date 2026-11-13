/**
 * StateViews — estados comunes de pantalla: cargando, error con reintento, vacio y paginacion.
 */

import { mensajeError } from '../utils/format.js'

const css = `
.state-view { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;
  padding:48px 24px; text-align:center; color:var(--ink-3); }
.state-view__title { font-family:var(--font-display, serif); font-size:18px; color:var(--ink); }
.state-view__hint { font-size:13px; max-width:420px; }
.state-view--error .state-view__title { color:var(--oxblood); }
.pager { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 0; font-size:13px; color:var(--ink-3); }
.pager__btns { display:flex; gap:8px; }
`

export function LoadingState({ label = 'Cargando…' }) {
  return (
    <div className="state-view" role="status" aria-live="polite">
      <style>{css}</style>
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state-view state-view--error" role="alert">
      <style>{css}</style>
      <span className="state-view__title">No se pudo cargar la información</span>
      <span className="state-view__hint">{mensajeError(error)}</span>
      {onRetry && <button type="button" className="btn btn--ghost" onClick={onRetry}>Reintentar</button>}
    </div>
  )
}

export function EmptyState({ title = 'Sin resultados', hint }) {
  return (
    <div className="state-view">
      <style>{css}</style>
      <span className="state-view__title">{title}</span>
      {hint && <span className="state-view__hint">{hint}</span>}
    </div>
  )
}

/** Paginacion para PageResponse del backend ({ page, totalPages, totalElements }); `page` base 0. */
export function Pagination({ page, totalPages, totalElements, onPage }) {
  if (!totalPages || totalPages <= 1) return null
  return (
    <div className="pager">
      <style>{css}</style>
      <span>{totalElements} registros · página {page + 1} de {totalPages}</span>
      <span className="pager__btns">
        <button type="button" className="btn btn--ghost" disabled={page <= 0} onClick={() => onPage(page - 1)}>Anterior</button>
        <button type="button" className="btn btn--ghost" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>Siguiente</button>
      </span>
    </div>
  )
}
