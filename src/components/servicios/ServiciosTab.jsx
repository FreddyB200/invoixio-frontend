import { useState } from 'react'
import Icon from '../Icon.jsx'
import { Modal, StatusChip } from '../SharedComponents.jsx'
import { EmptyState, ErrorState, LoadingState, Pagination } from '../StateViews.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { mensajeError } from '../../utils/format.js'
import { actualizarServicio, crearServicio, desactivarServicio, listarServicios } from '../../api/servicios.js'
import { APLICACION, ChipAplicacion } from './estilos.jsx'

const PAGE_SIZE = 20
const FORM_VACIO = { codigo: '', nombre: '', descripcion: '', aplicacion: 'TODOS', activo: true }

function validar(form) {
  const e = {}
  const codigo = form.codigo.trim()
  if (!codigo) e.codigo = 'El código es obligatorio'
  else if (codigo.length > 30) e.codigo = 'El código no puede superar 30 caracteres'
  else if (!/^[A-Za-z0-9_-]+$/.test(codigo)) e.codigo = 'El código solo admite letras, dígitos, guion y guion bajo'
  const nombre = form.nombre.trim()
  if (!nombre) e.nombre = 'El nombre es obligatorio'
  else if (nombre.length > 150) e.nombre = 'El nombre no puede superar 150 caracteres'
  if (form.descripcion.length > 500) e.descripcion = 'La descripción no puede superar 500 caracteres'
  return e
}

export default function ServiciosTab({ onNotify }) {
  const { puedeEscribirMaestros: puedeEscribir } = useAuth()
  const [filtro, setFiltro] = useState('')
  const [page, setPage] = useState(0)
  const activo = filtro === '' ? undefined : filtro === 'true'
  const { data, loading, error, reload } = useAsync(
    () => listarServicios({ activo, page, size: PAGE_SIZE }),
    [activo, page],
  )

  const [formAbierto, setFormAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [aDesactivar, setADesactivar] = useState(null)
  const [desactivando, setDesactivando] = useState(false)
  const [errorDesactivar, setErrorDesactivar] = useState('')

  const abrirNuevo = () => {
    setEditando(null)
    setForm(FORM_VACIO)
    setErrores({})
    setErrorGeneral('')
    setFormAbierto(true)
  }

  const abrirEditar = (s) => {
    setEditando(s)
    setForm({
      codigo: s.codigo,
      nombre: s.nombre,
      descripcion: s.descripcion ?? '',
      aplicacion: s.aplicacion,
      activo: s.activo,
    })
    setErrores({})
    setErrorGeneral('')
    setFormAbierto(true)
  }

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  const guardar = async () => {
    const e = validar(form)
    setErrores(e)
    setErrorGeneral('')
    if (Object.keys(e).length) return
    const payload = {
      codigo: form.codigo.trim(),
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      aplicacion: form.aplicacion,
      activo: form.activo,
    }
    setGuardando(true)
    try {
      if (editando) await actualizarServicio(editando.id, payload)
      else await crearServicio(payload)
      setFormAbierto(false)
      onNotify(editando ? 'Servicio actualizado' : 'Servicio creado')
      reload()
    } catch (err) {
      if (err.errores && Object.keys(err.errores).length) setErrores(err.errores)
      else setErrorGeneral(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const confirmarDesactivar = async () => {
    setDesactivando(true)
    setErrorDesactivar('')
    try {
      await desactivarServicio(aDesactivar.id)
      onNotify('Servicio desactivado')
      setADesactivar(null)
      reload()
    } catch (err) {
      setErrorDesactivar(mensajeError(err))
    } finally {
      setDesactivando(false)
    }
  }

  const servicios = data?.content ?? []

  return (
    <section aria-label="Catálogo de servicios">
      <div className="toolbar">
        <label className="form-label" htmlFor="sv-filtro">Mostrar</label>
        <select
          id="sv-filtro"
          className="form-select"
          style={{ width: 'auto' }}
          value={filtro}
          onChange={(e) => { setFiltro(e.target.value); setPage(0) }}
        >
          <option value="">Todos los servicios</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>
        {data && <span className="toolbar__count"><strong>{data.totalElements}</strong> servicio(s)</span>}
        {puedeEscribir && (
          <button type="button" className="btn btn--primary" onClick={abrirNuevo}>
            <Icon name="plus" size={13} />
            Nuevo servicio
          </button>
        )}
      </div>

      <div className="card">
        <div className="card__header">
          <div className="card__title-wrap">
            <span className="card__eyebrow">Catálogo</span>
            <span className="card__title">Servicios <em>facturables</em></span>
          </div>
        </div>
        <div className="card__body" style={{ padding: 0 }}>
          {loading && !data ? <LoadingState label="Cargando servicios…" />
            : error && !data ? <ErrorState error={error} onRetry={reload} />
            : servicios.length === 0 ? (
              <EmptyState
                title="Aún no hay servicios"
                hint={puedeEscribir ? 'Crea el primero: por ejemplo Administración o Mensualidad.' : 'Un administrador debe crear el catálogo.'}
              />
            ) : (
              <table aria-label="Lista de servicios">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Servicio</th>
                    <th>Aplicación</th>
                    <th>Estado</th>
                    {puedeEscribir && <th className="sv-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {servicios.map((s) => (
                    <tr key={s.id}>
                      <td><code className="code-chip">{s.codigo}</code></td>
                      <td>
                        <div className="sv-name">{s.nombre}</div>
                        {s.descripcion && <div className="sv-sub">{s.descripcion}</div>}
                      </td>
                      <td>
                        <ChipAplicacion aplicacion={s.aplicacion} />
                        <div className="sv-sub">{APLICACION[s.aplicacion]?.frase}</div>
                      </td>
                      <td><StatusChip status={s.activo ? 'Activo' : 'Inactivo'} /></td>
                      {puedeEscribir && (
                        <td>
                          <div className="sv-actions">
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm btn--icon-only"
                              aria-label={`Editar ${s.nombre}`}
                              onClick={() => abrirEditar(s)}
                            >
                              <Icon name="edit" size={12} />
                            </button>
                            {s.activo && (
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm btn--icon-only"
                                aria-label={`Desactivar ${s.nombre}`}
                                onClick={() => { setErrorDesactivar(''); setADesactivar(s) }}
                              >
                                <Icon name="trash" size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
      {data && (
        <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPage={setPage} />
      )}

      <Modal
        isOpen={formAbierto}
        onClose={() => setFormAbierto(false)}
        eyebrow={editando ? 'Edición de servicio' : 'Alta de servicio'}
        title={editando ? 'Editar servicio' : 'Nuevo servicio'}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setFormAbierto(false)}>Cancelar</button>
            <button type="button" className="btn btn--primary" onClick={guardar} disabled={guardando}>
              <Icon name="check" size={13} />
              {guardando ? 'Guardando…' : 'Guardar servicio'}
            </button>
          </>
        }
      >
        {errorGeneral && <div className="sv-note sv-note--error" role="alert">{errorGeneral}</div>}
        <div className="sv-grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="sv-codigo">Código *</label>
            <input
              id="sv-codigo"
              className={`form-input ${errores.codigo ? 'form-input--error' : ''}`}
              value={form.codigo}
              onChange={cambiar('codigo')}
              placeholder="ADMIN"
              maxLength={30}
            />
            {errores.codigo && <span className="error-msg" role="alert">{errores.codigo}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="sv-nombre">Nombre *</label>
            <input
              id="sv-nombre"
              className={`form-input ${errores.nombre ? 'form-input--error' : ''}`}
              value={form.nombre}
              onChange={cambiar('nombre')}
              placeholder="Administración"
            />
            {errores.nombre && <span className="error-msg" role="alert">{errores.nombre}</span>}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="sv-descripcion">Descripción</label>
          <textarea
            id="sv-descripcion"
            className="form-textarea"
            rows={2}
            value={form.descripcion}
            onChange={cambiar('descripcion')}
          />
          {errores.descripcion && <span className="error-msg" role="alert">{errores.descripcion}</span>}
        </div>
        <fieldset className="sv-radios">
          <legend className="form-label">Aplicación</legend>
          {Object.entries(APLICACION).map(([valor, info]) => (
            <label key={valor} className={`sv-radio ${form.aplicacion === valor ? 'sv-radio--on' : ''}`}>
              <input
                type="radio"
                name="sv-aplicacion"
                value={valor}
                checked={form.aplicacion === valor}
                onChange={() => setForm((f) => ({ ...f, aplicacion: valor }))}
              />
              <span>{info.etiqueta}<span>{info.frase}</span></span>
            </label>
          ))}
        </fieldset>
        <label className="sv-check">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
          />
          Servicio activo (disponible para facturar)
        </label>
      </Modal>

      <Modal
        isOpen={aDesactivar !== null}
        onClose={() => setADesactivar(null)}
        eyebrow="Confirmación requerida"
        title="Desactivar servicio"
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setADesactivar(null)}>Cancelar</button>
            <button type="button" className="btn btn--danger" onClick={confirmarDesactivar} disabled={desactivando}>
              <Icon name="warning" size={13} />
              Sí, desactivar
            </button>
          </>
        }
      >
        {errorDesactivar && <div className="sv-note sv-note--error" role="alert">{errorDesactivar}</div>}
        <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          ¿Deseas desactivar <strong>{aDesactivar?.nombre}</strong>? Dejará de facturarse en los próximos lotes.
          Las facturas ya generadas y sus tarifas se conservan; puedes reactivarlo editándolo.
        </p>
      </Modal>
    </section>
  )
}
