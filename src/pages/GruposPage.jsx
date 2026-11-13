/**
 * GruposPage — grupos de clientes (conjuntos, sedes, zonas o planes) conectados a la API.
 */

import { useCallback, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import Icon from '../components/Icon.jsx'
import { Modal, Toast, StatusChip } from '../components/SharedComponents.jsx'
import { LoadingState, ErrorState, EmptyState, Pagination } from '../components/StateViews.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { listarGrupos, crearGrupo, actualizarGrupo, desactivarGrupo } from '../api/grupos.js'
import { TIPOS_GRUPO, mensajeError } from '../utils/format.js'

const PAGE_SIZE = 20

const FORM_VACIO = { nombre: '', tipo: 'CONJUNTO', direccion: '', ciudad: '', activo: true }

const aFormulario = (g) => ({
  nombre: g.nombre ?? '',
  tipo: g.tipo,
  direccion: g.direccion ?? '',
  ciudad: g.ciudad ?? '',
  activo: g.activo,
})

const aPayload = (f) => ({
  nombre: f.nombre.trim(),
  tipo: f.tipo,
  direccion: f.direccion.trim() || null,
  ciudad: f.ciudad.trim() || null,
  activo: f.activo,
})

function Campo({ id, label, obligatorio, error, children, className }) {
  return (
    <div className={`form-group ${className || ''}`}>
      <label className="form-label" htmlFor={id}>
        {label}{obligatorio && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && <span className="error-msg" id={`${id}-error`} role="alert">{error}</span>}
    </div>
  )
}

function GruposPage() {
  const { puedeEscribirMaestros, empresaId } = useAuth()

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

  const filtroActivo = activo === '' ? undefined : activo === 'true'
  const lista = useAsync(
    () => listarGrupos({ activo: filtroActivo, page, size: PAGE_SIZE }),
    [activo, page, recarga, empresaId],
  )

  const pagina = lista.data
  const filas = pagina?.content ?? []

  const abrirNuevo = () => {
    setEditando(null)
    setForm(FORM_VACIO)
    setErrores({})
    setModalOpen(true)
  }

  const abrirEditar = (grupo) => {
    setEditando(grupo)
    setForm(aFormulario(grupo))
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
    if (!form.nombre.trim()) { setErrores({ nombre: 'El nombre es obligatorio' }); return }

    setGuardando(true)
    try {
      const payload = aPayload(form)
      if (editando) await actualizarGrupo(editando.id, payload)
      else await crearGrupo(payload)
      setModalOpen(false)
      setToast({ message: editando ? 'Grupo actualizado correctamente' : 'Grupo creado exitosamente', type: 'success' })
      if (!editando) setPage(0)
      setRecarga((n) => n + 1)
    } catch (err) {
      if (err.errores && Object.keys(err.errores).length > 0) {
        setErrores(err.errores)
        if (Object.keys(err.errores).some((k) => !(k in FORM_VACIO))) setToast({ message: mensajeError(err), type: 'error' })
      } else if (err.status === 409) setErrores({ nombre: err.message })
      else setToast({ message: mensajeError(err), type: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  const confirmarDesactivar = async () => {
    setDesactivando(true)
    try {
      await desactivarGrupo(aDesactivar.id)
      setADesactivar(null)
      setToast({ message: 'Grupo desactivado', type: 'success' })
      setRecarga((n) => n + 1)
    } catch (err) {
      setADesactivar(null)
      setToast({ message: mensajeError(err), type: 'error' })
    } finally {
      setDesactivando(false)
    }
  }

  const describir = (campo) => (errores[campo] ? { 'aria-invalid': true, 'aria-describedby': `gr-${campo}-error` } : {})
  const claseInput = (campo) => `form-input ${errores[campo] ? 'form-input--error' : ''}`

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Grupos de clientes" eyebrow="Módulo V · Agrupaciones" />

        <style>{`
          .gr-name {
            font-family: var(--font-serif);
            font-size: 14.5px;
            font-weight: 500;
            color: var(--ink);
            letter-spacing: -0.005em;
          }
          .gr-action-row {
            display: flex;
            gap: 6px;
            justify-content: flex-end;
          }
          .gr-filter { min-width: 170px; width: auto; }
          .gr-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          .gr-full { grid-column: 1 / -1; }
          .gr-check {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13.5px;
            color: var(--ink-2);
          }
          .gr-busy { opacity: 0.55; transition: opacity .15s ease; }
          @media (max-width: 640px) { .gr-grid { grid-template-columns: 1fr; } }
        `}</style>

        <main className="page-content">

          <div className="page-header">
            <div className="page-header__left">
              <span className="page-header__eyebrow">Módulo V · Agrupaciones</span>
              <h1>Grupos de <em>clientes</em></h1>
              <p>Un grupo reúne a los clientes de un mismo conjunto, sede, zona o plan, y define su tarifa base.</p>
            </div>
            {puedeEscribirMaestros && (
              <button type="button" className="btn btn--primary" onClick={abrirNuevo}>
                <Icon name="plus" size={13} />
                Nuevo grupo
              </button>
            )}
          </div>

          <div className="toolbar" role="search">
            <select
              className="form-select gr-filter"
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
                <span className="card__title">Agrupaciones <em>de clientes</em></span>
              </div>
              <span className="card__meta">Orden alfabético</span>
            </div>
            <div className="card__body" style={{ padding: 0 }}>
              {lista.error ? (
                <ErrorState error={lista.error} onRetry={lista.reload} />
              ) : !pagina ? (
                <LoadingState label="Cargando grupos…" />
              ) : filas.length === 0 ? (
                activo ? (
                  <EmptyState title="Sin resultados" hint="Ningún grupo coincide con el filtro aplicado." />
                ) : (
                  <EmptyState title="Aún no hay grupos" hint="Crea el primer grupo para poder registrar clientes." />
                )
              ) : (
                <div className={lista.loading ? 'gr-busy' : undefined} aria-busy={lista.loading}>
                  <table aria-label="Lista de grupos">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Dirección</th>
                        <th>Ciudad</th>
                        <th>Estado</th>
                        {puedeEscribirMaestros && <th style={{ textAlign: 'right' }}>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((g) => (
                        <tr key={g.id}>
                          <td><div className="gr-name">{g.nombre}</div></td>
                          <td><span className="chip chip--blue">{TIPOS_GRUPO[g.tipo] ?? g.tipo}</span></td>
                          <td>{g.direccion || '—'}</td>
                          <td>{g.ciudad || '—'}</td>
                          <td><StatusChip status={g.activo ? 'Activo' : 'Inactivo'} /></td>
                          {puedeEscribirMaestros && (
                            <td>
                              <div className="gr-action-row">
                                <button
                                  type="button"
                                  className="btn btn--ghost btn--sm btn--icon-only"
                                  onClick={() => abrirEditar(g)}
                                  aria-label={`Editar ${g.nombre}`}
                                >
                                  <Icon name="edit" size={12} />
                                </button>
                                {g.activo && (
                                  <button
                                    type="button"
                                    className="btn btn--ghost btn--sm btn--icon-only"
                                    onClick={() => setADesactivar(g)}
                                    aria-label={`Desactivar ${g.nombre}`}
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
        title={editando ? 'Editar grupo' : 'Nuevo grupo'}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
            <button type="submit" form="gr-form" className="btn btn--primary" disabled={guardando}>
              <Icon name="check" size={13} />
              {guardando ? 'Guardando…' : 'Guardar grupo'}
            </button>
          </>
        }
      >
        <form id="gr-form" className="gr-grid" onSubmit={guardar} noValidate>
          <Campo id="gr-nombre" label="Nombre" obligatorio error={errores.nombre} className="gr-full">
            <input id="gr-nombre" type="text" className={claseInput('nombre')} value={form.nombre} onChange={cambiar('nombre')} maxLength={150} {...describir('nombre')} />
          </Campo>
          <Campo id="gr-tipo" label="Tipo" obligatorio error={errores.tipo}>
            <select id="gr-tipo" className="form-select" value={form.tipo} onChange={cambiar('tipo')} {...describir('tipo')}>
              {Object.entries(TIPOS_GRUPO).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
            </select>
          </Campo>
          <Campo id="gr-ciudad" label="Ciudad" error={errores.ciudad}>
            <input id="gr-ciudad" type="text" className={claseInput('ciudad')} value={form.ciudad} onChange={cambiar('ciudad')} maxLength={100} {...describir('ciudad')} />
          </Campo>
          <Campo id="gr-direccion" label="Dirección" error={errores.direccion} className="gr-full">
            <input id="gr-direccion" type="text" className={claseInput('direccion')} value={form.direccion} onChange={cambiar('direccion')} maxLength={200} {...describir('direccion')} />
          </Campo>
          <div className="form-group gr-full">
            <label className="gr-check" htmlFor="gr-activo">
              <input id="gr-activo" type="checkbox" checked={form.activo} onChange={cambiar('activo')} />
              Activo
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(aDesactivar)}
        onClose={() => { if (!desactivando) setADesactivar(null) }}
        eyebrow="Confirmación requerida"
        title="Desactivar grupo"
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
          ¿Deseas <strong>desactivar</strong> el grupo {aDesactivar?.nombre}? Quedará inactivo y no podrá elegirse al registrar nuevos clientes.
          <br /><br />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--ink-4)', letterSpacing: '0.06em' }}>
            — Sus clientes y facturas históricas permanecen intactos.
          </span>
        </p>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={cerrarToast} />}
    </div>
  )
}

export default GruposPage
