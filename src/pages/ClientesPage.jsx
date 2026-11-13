/**
 * ClientesPage — directorio de clientes (propietarios o responsables de una unidad) conectado a la API.
 */

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import Icon from '../components/Icon.jsx'
import { Modal, Toast, StatusChip } from '../components/SharedComponents.jsx'
import { LoadingState, ErrorState, EmptyState, Pagination } from '../components/StateViews.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { listarClientes, crearCliente, actualizarCliente, desactivarCliente } from '../api/clientes.js'
import { listarGrupos } from '../api/grupos.js'
import { mensajeError } from '../utils/format.js'

const TIPOS_DOCUMENTO = ['CC', 'CE', 'NIT', 'PASAPORTE']
const PAGE_SIZE = 20
const DEBOUNCE_MS = 300

const FORM_VACIO = {
  grupoId: '',
  tipoDocumento: 'CC',
  documento: '',
  nombre: '',
  unidad: '',
  email: '',
  telefono: '',
  activo: true,
}

const aFormulario = (c) => ({
  grupoId: String(c.grupoId),
  tipoDocumento: c.tipoDocumento,
  documento: c.documento ?? '',
  nombre: c.nombre ?? '',
  unidad: c.unidad ?? '',
  email: c.email ?? '',
  telefono: c.telefono ?? '',
  activo: c.activo,
})

const aPayload = (f) => ({
  grupoId: Number(f.grupoId),
  nombre: f.nombre.trim(),
  tipoDocumento: f.tipoDocumento,
  documento: f.documento.trim(),
  email: f.email.trim() || null,
  telefono: f.telefono.trim() || null,
  unidad: f.unidad.trim(),
  activo: f.activo,
})

function validar(f) {
  const e = {}
  if (!f.grupoId) e.grupoId = 'El grupo es obligatorio'
  if (!f.nombre.trim()) e.nombre = 'El nombre es obligatorio'
  if (!f.documento.trim()) e.documento = 'El documento es obligatorio'
  if (!f.unidad.trim()) e.unidad = 'La unidad es obligatoria'
  return e
}

function Campo({ id, label, obligatorio, error, children, className, style }) {
  return (
    <div className={`form-group ${className || ''}`} style={style}>
      <label className="form-label" htmlFor={id}>
        {label}{obligatorio && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && <span className="error-msg" id={`${id}-error`} role="alert">{error}</span>}
    </div>
  )
}

function ClientesPage() {
  const { puedeEscribirMaestros, empresaId } = useAuth()

  const [busqueda, setBusqueda] = useState('')
  const [q, setQ] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [activo, setActivo] = useState('')
  const [page, setPage] = useState(0)
  const [recarga, setRecarga] = useState(0)

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const [aDesactivar, setADesactivar] = useState(null)
  const [desactivando, setDesactivando] = useState(false)

  const [toast, setToast] = useState(null)
  const cerrarToast = useCallback(() => setToast(null), [])

  useEffect(() => {
    if (busqueda.trim() === q) return undefined
    const t = setTimeout(() => { setQ(busqueda.trim()); setPage(0) }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [busqueda, q])

  const grupos = useAsync(() => listarGrupos({ size: 100 }), [empresaId])
  const listaGrupos = grupos.data?.content ?? []

  const filtroActivo = activo === '' ? undefined : activo === 'true'
  const lista = useAsync(
    () => listarClientes({ q: q || undefined, grupoId: grupoId || undefined, activo: filtroActivo, page, size: PAGE_SIZE }),
    [q, grupoId, activo, page, recarga, empresaId],
  )

  const pagina = lista.data
  const filas = pagina?.content ?? []
  const hayFiltros = Boolean(q || grupoId || activo)
  const gruposDelFormulario = listaGrupos.filter((g) => g.activo || String(g.id) === form.grupoId)

  const abrirNuevo = () => {
    setEditando(null)
    setForm(FORM_VACIO)
    setErrores({})
    setModalOpen(true)
  }

  const abrirEditar = (cliente) => {
    setEditando(cliente)
    setForm(aFormulario(cliente))
    setErrores({})
    setModalOpen(true)
  }

  const cerrarModal = () => { if (!guardando) setModalOpen(false) }

  const cambiar = (campo) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((p) => ({ ...p, [campo]: valor }))
    setErrores((p) => (p[campo] ? { ...p, [campo]: undefined } : p))
  }

  const guardar = async (e) => {
    e.preventDefault()
    const locales = validar(form)
    if (Object.keys(locales).length > 0) { setErrores(locales); return }

    setGuardando(true)
    try {
      const payload = aPayload(form)
      if (editando) await actualizarCliente(editando.id, payload)
      else await crearCliente(payload)
      setModalOpen(false)
      setToast({ message: editando ? 'Cliente actualizado correctamente' : 'Cliente registrado exitosamente', type: 'success' })
      if (!editando) setPage(0)
      setRecarga((n) => n + 1)
    } catch (err) {
      if (err.errores && Object.keys(err.errores).length > 0) {
        setErrores(err.errores)
        if (Object.keys(err.errores).some((k) => !(k in FORM_VACIO))) setToast({ message: mensajeError(err), type: 'error' })
      } else if (err.status === 409) setErrores({ unidad: err.message })
      else setToast({ message: mensajeError(err), type: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  const confirmarDesactivar = async () => {
    setDesactivando(true)
    try {
      await desactivarCliente(aDesactivar.id)
      setADesactivar(null)
      setToast({ message: 'Cliente desactivado', type: 'success' })
      setRecarga((n) => n + 1)
    } catch (err) {
      setADesactivar(null)
      setToast({ message: mensajeError(err), type: 'error' })
    } finally {
      setDesactivando(false)
    }
  }

  const describir = (campo) => (errores[campo] ? { 'aria-invalid': true, 'aria-describedby': `cl-${campo}-error` } : {})
  const claseInput = (campo) => `form-input ${errores[campo] ? 'form-input--error' : ''}`

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Directorio de Clientes" eyebrow="Módulo III · Relaciones comerciales" />

        <style>{`
          .cl-name {
            font-family: var(--font-serif);
            font-size: 14.5px;
            font-weight: 500;
            color: var(--ink);
            letter-spacing: -0.005em;
          }
          .cl-sub {
            font-family: var(--font-mono);
            font-size: 11px;
            color: var(--ink-4);
            margin-top: 2px;
          }
          .cl-mono { font-family: var(--font-mono); font-size: 12px; }
          .cl-action-row {
            display: flex;
            gap: 6px;
            justify-content: flex-end;
          }
          .cl-filter { min-width: 170px; width: auto; }
          .cl-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          .cl-full { grid-column: 1 / -1; }
          .cl-check {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13.5px;
            color: var(--ink-2);
          }
          .cl-busy { opacity: 0.55; transition: opacity .15s ease; }
          @media (max-width: 640px) { .cl-grid { grid-template-columns: 1fr; } }
        `}</style>

        <main className="page-content">

          <div className="page-header">
            <div className="page-header__left">
              <span className="page-header__eyebrow">Módulo III · Directorio</span>
              <h1>Clientes <em>registrados</em></h1>
              <p>Propietarios o responsables de cada unidad: su documento, su grupo y sus datos de contacto.</p>
            </div>
            {puedeEscribirMaestros && (
              <button type="button" className="btn btn--primary" onClick={abrirNuevo}>
                <Icon name="plus" size={13} />
                Nuevo cliente
              </button>
            )}
          </div>

          <div className="toolbar" role="search">
            <div className="search-wrap">
              <span className="search-wrap__icon"><Icon name="search" size={14} /></span>
              <input
                type="search"
                className="search-input"
                placeholder="Buscar por nombre, documento o unidad…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar clientes"
              />
            </div>
            <select
              className="form-select cl-filter"
              aria-label="Filtrar por grupo"
              value={grupoId}
              onChange={(e) => { setGrupoId(e.target.value); setPage(0) }}
            >
              <option value="">Todos los grupos</option>
              {listaGrupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
            <select
              className="form-select cl-filter"
              aria-label="Filtrar por estado"
              value={activo}
              onChange={(e) => { setActivo(e.target.value); setPage(0) }}
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
            {pagina && (
              <span className="toolbar__count">
                <strong>{pagina.totalElements}</strong> resultado(s)
              </span>
            )}
          </div>

          <div className="card">
            <div className="card__header">
              <div className="card__title-wrap">
                <span className="card__eyebrow">Registro</span>
                <span className="card__title">Directorio <em>comercial</em></span>
              </div>
              <span className="card__meta">Orden alfabético</span>
            </div>
            <div className="card__body" style={{ padding: 0 }}>
              {lista.error ? (
                <ErrorState error={lista.error} onRetry={lista.reload} />
              ) : !pagina ? (
                <LoadingState label="Cargando clientes…" />
              ) : filas.length === 0 ? (
                hayFiltros ? (
                  <EmptyState title="Sin resultados" hint="Ningún cliente coincide con la búsqueda o los filtros aplicados." />
                ) : (
                  <EmptyState
                    title="Aún no hay clientes"
                    hint={listaGrupos.length === 0 && !grupos.loading
                      ? <>Primero crea un grupo en <Link to="/grupos">Grupos de clientes</Link> y luego registra a sus clientes.</>
                      : 'Registra el primer cliente para empezar a facturar.'}
                  />
                )
              ) : (
                <div className={lista.loading ? 'cl-busy' : undefined} aria-busy={lista.loading}>
                  <table aria-label="Lista de clientes">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Documento</th>
                        <th>Grupo</th>
                        <th>Unidad</th>
                        <th>Teléfono</th>
                        <th>Estado</th>
                        {puedeEscribirMaestros && <th style={{ textAlign: 'right' }}>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div className="cl-name">{c.nombre}</div>
                            {c.email && <div className="cl-sub">{c.email}</div>}
                          </td>
                          <td>
                            <code className="code-chip">{c.documento}</code>
                            <div className="cl-sub">{c.tipoDocumento}</div>
                          </td>
                          <td>{c.grupoNombre}</td>
                          <td className="cl-mono">{c.unidad}</td>
                          <td className="cl-mono">{c.telefono || '—'}</td>
                          <td><StatusChip status={c.activo ? 'Activo' : 'Inactivo'} /></td>
                          {puedeEscribirMaestros && (
                            <td>
                              <div className="cl-action-row">
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm btn--icon-only"
                                  onClick={() => abrirEditar(c)}
                                  aria-label={`Editar ${c.nombre}`}
                                >
                                  <Icon name="edit" size={12} />
                                </button>
                                {c.activo && (
                                  <button
                                    type="button"
                                    className="btn btn--ghost btn--sm btn--icon-only"
                                    onClick={() => setADesactivar(c)}
                                    aria-label={`Desactivar ${c.nombre}`}
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
                </div>
              )}
            </div>
          </div>

          {pagina && (
            <Pagination
              page={pagina.page}
              totalPages={pagina.totalPages}
              totalElements={pagina.totalElements}
              onPage={setPage}
            />
          )}
        </main>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={cerrarModal}
        eyebrow={editando ? 'Edición de registro' : 'Alta de registro'}
        title={editando ? 'Editar cliente' : 'Nuevo cliente'}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
            <button type="submit" form="cl-form" className="btn btn--primary" disabled={guardando}>
              <Icon name="check" size={13} />
              {guardando ? 'Guardando…' : 'Guardar cliente'}
            </button>
          </>
        }
      >
        <form id="cl-form" className="cl-grid" onSubmit={guardar} noValidate>
          <Campo id="cl-grupoId" label="Grupo" obligatorio error={errores.grupoId} className="cl-full">
            <select id="cl-grupoId" className={`form-select ${errores.grupoId ? 'form-input--error' : ''}`} value={form.grupoId} onChange={cambiar('grupoId')} {...describir('grupoId')}>
              <option value="">Selecciona un grupo</option>
              {gruposDelFormulario.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
            {grupos.error && <span className="error-msg" role="alert">No se pudieron cargar los grupos. Recarga la página.</span>}
          </Campo>
          <Campo id="cl-nombre" label="Nombre" obligatorio error={errores.nombre} className="cl-full">
            <input id="cl-nombre" type="text" className={claseInput('nombre')} value={form.nombre} onChange={cambiar('nombre')} maxLength={150} {...describir('nombre')} />
          </Campo>
          <Campo id="cl-tipoDocumento" label="Tipo de documento" obligatorio error={errores.tipoDocumento}>
            <select id="cl-tipoDocumento" className="form-select" value={form.tipoDocumento} onChange={cambiar('tipoDocumento')} {...describir('tipoDocumento')}>
              {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Campo>
          <Campo id="cl-documento" label="Documento" obligatorio error={errores.documento}>
            <input id="cl-documento" type="text" className={claseInput('documento')} value={form.documento} onChange={cambiar('documento')} placeholder="900123456-1" maxLength={30} {...describir('documento')} />
          </Campo>
          <Campo id="cl-unidad" label="Unidad / referencia" obligatorio error={errores.unidad}>
            <input id="cl-unidad" type="text" className={claseInput('unidad')} value={form.unidad} onChange={cambiar('unidad')} placeholder="Apto 101, Casa 4, Sede Norte…" maxLength={50} {...describir('unidad')} />
          </Campo>
          <Campo id="cl-email" label="Correo electrónico" error={errores.email}>
            <input id="cl-email" type="email" className={claseInput('email')} value={form.email} onChange={cambiar('email')} maxLength={150} {...describir('email')} />
          </Campo>
          <Campo id="cl-telefono" label="Teléfono" error={errores.telefono}>
            <input id="cl-telefono" type="tel" className={claseInput('telefono')} value={form.telefono} onChange={cambiar('telefono')} {...describir('telefono')} />
          </Campo>
          <div className="form-group">
            <label className="cl-check" htmlFor="cl-activo">
              <input id="cl-activo" type="checkbox" checked={form.activo} onChange={cambiar('activo')} />
              Activo
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(aDesactivar)}
        onClose={() => { if (!desactivando) setADesactivar(null) }}
        eyebrow="Confirmación requerida"
        title="Desactivar cliente"
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setADesactivar(null)} disabled={desactivando}>Cancelar</button>
            <button type="button" className="btn btn--danger" onClick={confirmarDesactivar} disabled={desactivando}>
              <Icon name="warning" size={13} />
              Sí, desactivar
            </button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--ink-2)', lineHeight: '1.6' }}>
          ¿Deseas <strong>desactivar</strong> a {aDesactivar?.nombre}? El registro quedará inactivo y dejará de aparecer en los selectores de facturación.
          <br /><br />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--ink-4)', letterSpacing: '0.06em' }}>
            — Las facturas históricas permanecen intactas.
          </span>
        </p>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={cerrarToast} />}
    </div>
  )
}

export default ClientesPage
