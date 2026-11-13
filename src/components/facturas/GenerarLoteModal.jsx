import { useState } from 'react'
import { Modal } from '../SharedComponents.jsx'
import { generarLote } from '../../api/facturas.js'
import { formatPeriodo } from '../../utils/format.js'

const css = `
.fa-res { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--rule); border:1px solid var(--rule); margin-top:6px; }
.fa-res > div { background:var(--surface); padding:14px 12px; display:flex; flex-direction:column; gap:4px; }
.fa-res strong { font-family:var(--font-mono); font-size:24px; font-weight:600; color:var(--ink); }
.fa-res span { font-size:11.5px; color:var(--ink-3); }
.fa-hint { font-size:12px; color:var(--ink-4); margin-top:4px; }
`

/**
 * Generación en lote de borradores. `onHecho` se llama tras generar para recargar el listado;
 * `onError(err)` muestra el fallo (422 periodo futuro, 404 grupo) sin cerrar el modal.
 */
export default function GenerarLoteModal({ periodoInicial, grupoInicial, grupos, onHecho, onError, onClose }) {
  const [periodo, setPeriodo] = useState(periodoInicial)
  const [grupoId, setGrupoId] = useState(grupoInicial || '')
  const [dias, setDias] = useState('')
  const [busy, setBusy] = useState(false)
  const [validacion, setValidacion] = useState('')
  const [resultado, setResultado] = useState(null)

  const enviar = async (e) => {
    e.preventDefault()
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) { setValidacion('Indica un periodo válido (año y mes).'); return }
    const diasNum = dias === '' ? undefined : Number(dias)
    if (diasNum !== undefined && (!Number.isInteger(diasNum) || diasNum < 1 || diasNum > 31)) {
      setValidacion('Los días de vencimiento deben estar entre 1 y 31.')
      return
    }
    setValidacion('')
    setBusy(true)
    try {
      const res = await generarLote({
        periodo,
        grupoId: grupoId ? Number(grupoId) : undefined,
        diasVencimiento: diasNum,
      })
      setResultado(res)
      onHecho?.(res)
    } catch (err) {
      onError?.(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      eyebrow="Facturación en lote"
      title="Generar facturas del periodo"
      footer={
        resultado ? (
          <button type="button" className="btn btn--primary" onClick={onClose}>Cerrar</button>
        ) : (
          <>
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>Cancelar</button>
            <button type="submit" form="fa-form-lote" className="btn btn--primary" disabled={busy}>
              {busy ? 'Generando…' : 'Generar facturas'}
            </button>
          </>
        )
      }
    >
      <style>{css}</style>
      {resultado ? (
        <div role="status">
          <p style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
            Resultado para {formatPeriodo(resultado.periodo)}. Las facturas nuevas quedan en borrador hasta que las emitas.
          </p>
          <div className="fa-res">
            <div><strong>{resultado.creadas}</strong><span>creadas</span></div>
            <div><strong>{resultado.omitidasExistentes}</strong><span>omitidas, ya existían</span></div>
            <div><strong>{resultado.omitidasSinServicios}</strong><span>omitidas, sin servicios</span></div>
          </div>
        </div>
      ) : (
        <form id="fa-form-lote" onSubmit={enviar} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="fa-lote-periodo">Periodo</label>
            <input
              id="fa-lote-periodo" type="month" className="form-input" value={periodo}
              onChange={(e) => setPeriodo(e.target.value)} placeholder="AAAA-MM"
            />
            <p className="fa-hint">No se pueden generar facturas de periodos futuros. Si ya existen, se omiten.</p>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="fa-lote-grupo">Grupo (opcional)</label>
            <select id="fa-lote-grupo" className="form-select" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
              <option value="">Todos los grupos</option>
              {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="fa-lote-dias">Día de vencimiento del mes (opcional)</label>
            <input
              id="fa-lote-dias" type="number" min="1" max="31" className="form-input" value={dias}
              onChange={(e) => setDias(e.target.value)} placeholder="Por defecto, día 15"
            />
          </div>
          {validacion && <p className="error-msg" role="alert">{validacion}</p>}
        </form>
      )}
    </Modal>
  )
}
