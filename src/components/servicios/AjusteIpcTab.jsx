import { useState } from 'react'
import Icon from '../Icon.jsx'
import { Modal } from '../SharedComponents.jsx'
import { EmptyState, ErrorState, LoadingState } from '../StateViews.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { formatDate, mensajeError } from '../../utils/format.js'
import { aplicarAjusteIpc, listarAjustes, listarTodosGrupos } from '../../api/tarifas.js'
import { formatPorcentaje } from './estilos.jsx'

const formatFactor = (p) => (1 + p / 100).toLocaleString('es-CO', { maximumFractionDigits: 6 })

function validar({ anio, porcentaje }) {
  const e = {}
  const a = Number(anio)
  if (!Number.isInteger(a) || a < 2000 || a > 2100) e.anio = 'El año debe estar entre 2000 y 2100.'
  const texto = porcentaje.trim().replace(',', '.')
  const p = Number(texto)
  if (texto === '' || !Number.isFinite(p)) e.porcentaje = 'Indica el porcentaje, por ejemplo 5,2.'
  else if (p <= -50 || p > 100) e.porcentaje = 'El porcentaje debe ser mayor que -50 y no superar 100.'
  else if (!/^-?\d+(\.\d{1,4})?$/.test(texto)) e.porcentaje = 'El porcentaje admite hasta 4 decimales.'
  return e
}

function AjusteModal({ abierto, onClose, onAplicado }) {
  const [paso, setPaso] = useState('formulario')
  const [form, setForm] = useState({ anio: String(new Date().getFullYear()), porcentaje: '', grupoId: '' })
  const [errores, setErrores] = useState({})
  const [errorApi, setErrorApi] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const grupos = useAsync(() => (abierto ? listarTodosGrupos({ activo: true }) : Promise.resolve([])), [abierto])

  const porcentaje = Number(form.porcentaje.trim().replace(',', '.'))
  const grupo = (grupos.data ?? []).find((g) => String(g.id) === form.grupoId)
  const ambito = grupo ? `del grupo ${grupo.nombre}` : 'de toda la empresa'

  const cerrar = () => {
    setPaso('formulario')
    setErrores({})
    setErrorApi('')
    setResultado(null)
    setForm((f) => ({ ...f, porcentaje: '', grupoId: '' }))
    onClose()
  }

  const continuar = () => {
    const e = validar(form)
    setErrores(e)
    if (Object.keys(e).length === 0) { setErrorApi(''); setPaso('confirmar') }
  }

  const aplicar = async () => {
    const payload = { anio: Number(form.anio), porcentaje }
    if (form.grupoId) payload.grupoId = Number(form.grupoId)
    setEnviando(true)
    setErrorApi('')
    try {
      const res = await aplicarAjusteIpc(payload)
      setResultado(res)
      setPaso('resultado')
      onAplicado(res)
    } catch (err) {
      setErrorApi(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  const pie = {
    formulario: (
      <>
        <button type="button" className="btn btn--ghost" onClick={cerrar}>Cancelar</button>
        <button type="button" className="btn btn--primary" onClick={continuar}>Revisar ajuste</button>
      </>
    ),
    confirmar: (
      <>
        <button type="button" className="btn btn--ghost" onClick={() => setPaso('formulario')} disabled={enviando}>Volver</button>
        <button type="button" className="btn btn--danger" onClick={aplicar} disabled={enviando}>
          <Icon name="warning" size={13} />
          {enviando ? 'Aplicando…' : 'Aplicar ajuste'}
        </button>
      </>
    ),
    resultado: <button type="button" className="btn btn--primary" onClick={cerrar}>Listo</button>,
  }[paso]

  return (
    <Modal
      isOpen={abierto}
      onClose={cerrar}
      eyebrow="Ajuste anual (IPC)"
      title={paso === 'resultado' ? 'Ajuste aplicado' : 'Ajustar tarifas'}
      footer={pie}
    >
      {paso === 'formulario' && (
        <>
          <div className="sv-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="sv-ipc-anio">Año *</label>
              <input
                id="sv-ipc-anio"
                type="number"
                className={`form-input ${errores.anio ? 'form-input--error' : ''}`}
                value={form.anio}
                onChange={(e) => setForm((f) => ({ ...f, anio: e.target.value }))}
              />
              {errores.anio && <span className="error-msg" role="alert">{errores.anio}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="sv-ipc-porcentaje">Porcentaje (%) *</label>
              <input
                id="sv-ipc-porcentaje"
                inputMode="decimal"
                className={`form-input ${errores.porcentaje ? 'form-input--error' : ''}`}
                placeholder="5,2"
                value={form.porcentaje}
                onChange={(e) => setForm((f) => ({ ...f, porcentaje: e.target.value }))}
              />
              {errores.porcentaje && <span className="error-msg" role="alert">{errores.porcentaje}</span>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="sv-ipc-ambito">Ámbito</label>
            <select
              id="sv-ipc-ambito"
              className="form-select"
              value={form.grupoId}
              onChange={(e) => setForm((f) => ({ ...f, grupoId: e.target.value }))}
            >
              <option value="">Toda la empresa</option>
              {(grupos.data ?? []).map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </div>
          <div className="sv-note">
            El ajuste se aplica una sola vez por año y ámbito. No modifica facturas ya generadas.
          </div>
        </>
      )}

      {paso === 'confirmar' && (
        <>
          <div className="sv-steps">Paso 2 de 2 · Confirmación</div>
          {errorApi && <div className="sv-note sv-note--error" role="alert">{errorApi}</div>}
          <div className="sv-note sv-note--warn">
            Se multiplicarán todas las tarifas y overrides {ambito} por <strong>{formatFactor(porcentaje)}</strong> ({formatPorcentaje(porcentaje)}).
            Esto no se puede repetir en {form.anio}.
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            Los valores se redondean al peso entero. Las facturas ya generadas conservan su valor.
          </p>
        </>
      )}

      {paso === 'resultado' && resultado && (
        <div className="sv-result" role="status">
          <strong>{resultado.tarifasAfectadas} tarifas · {resultado.overridesAfectados} overrides</strong>
          <p>
            se ajustaron {formatPorcentaje(resultado.porcentaje)} para {resultado.anio}
            {resultado.grupoNombre ? ` en el grupo ${resultado.grupoNombre}` : ' en toda la empresa'}.
          </p>
        </div>
      )}
    </Modal>
  )
}

export default function AjusteIpcTab({ onNotify }) {
  const { puedeEscribirMaestros } = useAuth()
  const { data, loading, error, reload } = useAsync(() => listarAjustes(), [])
  const [abierto, setAbierto] = useState(false)

  return (
    <section aria-label="Ajuste anual de tarifas">
      <div className="toolbar">
        <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>
          Sube o baja todas las tarifas con un porcentaje, una vez por año y ámbito.
        </span>
        {puedeEscribirMaestros && (
          <button type="button" className="btn btn--primary" style={{ marginLeft: 'auto' }} onClick={() => setAbierto(true)}>
            <Icon name="plus" size={13} />
            Aplicar ajuste anual
          </button>
        )}
      </div>

      <div className="card">
        <div className="card__header">
          <div className="card__title-wrap">
            <span className="card__eyebrow">Historial</span>
            <span className="card__title">Bitácora de <em>ajustes</em></span>
          </div>
          <span className="card__meta">Del más reciente al más antiguo</span>
        </div>
        <div className="card__body" style={{ padding: 0 }}>
          {loading && !data ? <LoadingState label="Cargando bitácora…" />
            : error && !data ? <ErrorState error={error} onRetry={reload} />
            : data.length === 0 ? (
              <EmptyState title="Aún no se han aplicado ajustes" hint="Cuando apliques uno quedará registrado aquí." />
            ) : (
              <table aria-label="Bitácora de ajustes de tarifas">
                <thead>
                  <tr>
                    <th>Año</th>
                    <th>Porcentaje</th>
                    <th>Ámbito</th>
                    <th className="sv-right">Tarifas</th>
                    <th className="sv-right">Overrides</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((a) => (
                    <tr key={a.id}>
                      <td className="sv-mono">{a.anio}</td>
                      <td className="sv-mono">{formatPorcentaje(a.porcentaje)}</td>
                      <td>{a.grupoNombre ?? 'Toda la empresa'}</td>
                      <td className="sv-right sv-mono">{a.tarifasAfectadas}</td>
                      <td className="sv-right sv-mono">{a.overridesAfectados}</td>
                      <td className="sv-mono">{formatDate(a.creadoEn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {puedeEscribirMaestros && (
        <AjusteModal
          abierto={abierto}
          onClose={() => setAbierto(false)}
          onAplicado={() => { onNotify('Ajuste anual aplicado'); reload() }}
        />
      )}
    </section>
  )
}
