/**
 * EmpleadosPage — personal de la empresa y de cada grupo (solo ADMIN_GENERAL y ADMIN_EMPRESA).
 */

import { useCallback, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import Icon from '../components/Icon.jsx'
import { Modal, Toast, StatusChip } from '../components/SharedComponents.jsx'
import { LoadingState, ErrorState, EmptyState, Pagination } from '../components/StateViews.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { formatDate, mensajeError } from '../utils/format.js'
import {
  TIPOS_DOCUMENTO, listarEmpleados, crearEmpleado, actualizarEmpleado, desactivarEmpleado, listarGrupos,
} from '../api/empleados.js'

const TAMANO_PAGINA = 20

const FORM_VACIO = {
  nombre: '', tipoDocumento: 'CC', documento: '', cargo: '', email: '', telefono: '', fechaIngreso: '', grupoId: '', activo: true,
}

const CAMPOS_FORMULARIO = Object.keys(FORM_VACIO)

const aForm = (e) => ({
  nombre: e.nombre,
  tipoDocumento: e.tipoDocumento,
  documento: e.documento,
  cargo: e.cargo,
  email: e.email ?? '',
  telefono: e.telefono ?? '',
  fechaIngreso: e.fechaIngreso ?? '',
  grupoId: e.grupoId == null ? '' : String(e.grupoId),
  activo: e.activo,
})

const aPayload = (f) => ({
  grupoId: f.grupoId === '' ? null : Number(f.grupoId),
  nombre: f.nombre.trim(),
  tipoDocumento: f.tipoDocumento,
  documento: f.documento.trim(),
  cargo: f.cargo.trim(),
  email: f.email.trim() || null,
  telefono: f.telefono.trim() || null,
  fechaIngreso: f.fechaIngreso || null,
  activo: f.activo,
})

function validar(f) {
  const e = {}
  if (!f.nombre.trim()) e.nombre = 'El nombre es obligatorio'
  if (!f.documento.trim()) e.documento = 'El documento es obligatorio'
  if (!f.cargo.trim()) e.cargo = 'El cargo es obligatorio'
  return e
}

const css = `
.em-name { font-family: var(--font-serif); font-size: 14.5px; font-weight: 500; color: var(--ink); letter-spacing: -0.005em; }
.em-sub { font-family: var(--font-mono); font-size: 11px; color: var(--ink-4); margin-top: 2px; }
.em-actions { display: flex; gap: 6px; justify-content: flex-end; }
.em-filter { display: flex; align-items: center; gap: 8px; }
.em-filter .form-select { min-width: 180px; }
.em-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.em-grid__full { grid-column: 1 / -1; }
.em-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-2); }
.em-banner { margin-bottom: 14px; padding: 10px 14px; border: 1px solid #e3c3bc; background: var(--oxblood-wash); color: var(--oxblood); font-size: 13px; }
@media (max-width: 640px) { .em-grid { grid-template-columns: 1fr; } }
`

function Campo({ id, label, error, full, children }) {
  return (
    <div className={`form-group ${full ? 'em-grid__full' : ''}`}>
      <label className="form-label" htmlFor={id}>{label}</label>
      {children}
      {error && <span className="error-msg" role="alert">{error}</span>}
    </div>
  )
}

function Restringido() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Empleados" eyebrow="Módulo VII · Personal" />
        <main className="page-content">
          <EmptyState
            title="Acceso restringido"
            hint="El personal solo puede consultarse y administrarse con un rol de administrador."
          />
        </main>
      </div>
    </div>
  )
}

function EmpleadosContenido() {
  const [grupoFiltro, setGrupoFiltro] = useState('')
  const [activoFiltro, setActivoFiltro] = useState('')
  const [page, setPage] = useState(0)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [aDesactivar, setADesactivar] = useState(null)
  const [desactivando, setDesactivando] = useState(false)
  const [toast, setToast] = useState(null)
  const cerrarToast = useCallback(() => setToast(null), [])

  const { data: grupos } = useAsync(async () => (await listarGrupos()).content ?? [], [])
  const { data: pagina, loading, error, reload } = useAsync(
    () => listarEmpleados({
      grupoId: grupoFiltro ? Number(grupoFiltro) : undefined,
      activo: activoFiltro === '' ? undefined : activoFiltro === 'true',
      page,
      size: TAMANO_PAGINA,
    }),
    [grupoFiltro, activoFiltro, page],
  )

  const empleados = pagina?.content ?? []
  const listaGrupos = grupos ?? []

  const cambiarFiltro = (setter) => (e) => { setter(e.target.value); setPage(0) }
  const campo = (nombre) => (e) => {
    const valor = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [nombre]: valor }))
  }

  const abrirNuevo = () => {
    setEditando(null)
    setForm(FORM_VACIO)
    setErrores({})
    setErrorGeneral(null)
    setModalAbierto(true)
  }

  const abrirEdicion = (empleado) => {
    setEditando(empleado)
    setForm(aForm(empleado))
    setErrores({})
    setErrorGeneral(null)
    setModalAbierto(true)
  }

  const cerrarModal = () => { if (!guardando) setModalAbierto(false) }

  const guardar = async () => {
    const locales = validar(form)
    if (Object.keys(locales).length > 0) { setErrores(locales); setErrorGeneral(null); return }
    setGuardando(true)
    setErrores({})
    setErrorGeneral(null)
    try {
      if (editando) await actualizarEmpleado(editando.id, aPayload(form))
      else await crearEmpleado(aPayload(form))
      setModalAbierto(false)
      setToast({ message: editando ? 'Empleado actualizado correctamente' : 'Empleado registrado exitosamente', type: 'success' })
      if (!editando && page !== 0) setPage(0)
      else reload()
    } catch (err) {
      const porCampo = err.errores ?? {}
      if (CAMPOS_FORMULARIO.some((c) => porCampo[c])) setErrores(porCampo)
      else setErrorGeneral(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const confirmarDesactivar = async () => {
    setDesactivando(true)
    try {
      await desactivarEmpleado(aDesactivar.id)
      setToast({ message: 'Empleado desactivado', type: 'success' })
      setADesactivar(null)
      reload()
    } catch (err) {
      setADesactivar(null)
      setToast({ message: mensajeError(err), type: 'error' })
    } finally {
      setDesactivando(false)
    }
  }

  const gruposDelForm = listaGrupos.filter((g) => g.activo || String(g.id) === form.grupoId)

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Empleados" eyebrow="Módulo VII · Personal" />
        <style>{css}</style>

        <main className="page-content">
          <div className="page-header">
            <div className="page-header__left">
              <span className="page-header__eyebrow">Módulo VII · Personal</span>
              <h1>Equipo de <em>trabajo</em></h1>
              <p>Registra al personal de la empresa y el que atiende cada conjunto, sede, zona o plan.</p>
            </div>
            <button type="button" className="btn btn--primary" onClick={abrirNuevo}>
              <Icon name="plus" size={13} />
              Nuevo empleado
            </button>
          </div>

          <div className="toolbar">
            <label className="em-filter">
              <span className="sr-only">Filtrar por grupo</span>
              <select className="form-select" aria-label="Filtrar por grupo" value={grupoFiltro} onChange={cambiarFiltro(setGrupoFiltro)}>
                <option value="">Todos los grupos</option>
                {listaGrupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            </label>
            <label className="em-filter">
              <span className="sr-only">Filtrar por estado</span>
              <select className="form-select" aria-label="Filtrar por estado" value={activoFiltro} onChange={cambiarFiltro(setActivoFiltro)}>
                <option value="">Todos los estados</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </label>
            <span className="toolbar__count">
              <strong>{pagina?.totalElements ?? 0}</strong> empleado(s)
            </span>
          </div>

          <div className="card">
            <div className="card__header">
              <div className="card__title-wrap">
                <span className="card__eyebrow">Registro</span>
                <span className="card__title">Personal <em>registrado</em></span>
              </div>
              <span className="card__meta">Orden alfabético</span>
            </div>
            <div className="card__body" style={{ padding: 0 }}>
              {loading && !pagina && <LoadingState label="Cargando empleados…" />}
              {error && <ErrorState error={error} onRetry={reload} />}
              {!error && pagina && empleados.length === 0 && (
                <EmptyState title="Sin empleados" hint="No hay empleados que coincidan con los filtros." />
              )}
              {!error && empleados.length > 0 && (
                <table aria-label="Lista de empleados">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>Documento</th>
                      <th>Cargo</th>
                      <th>Grupo</th>
                      <th>Ingreso</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleados.map((e) => (
                      <tr key={e.id}>
                        <td>
                          <div className="em-name">{e.nombre}</div>
                          <div className="em-sub">{[e.email, e.telefono].filter(Boolean).join(' · ') || '—'}</div>
                        </td>
                        <td><code className="code-chip">{e.tipoDocumento} {e.documento}</code></td>
                        <td>{e.cargo}</td>
                        <td>{e.grupoNombre ?? 'Toda la empresa'}</td>
                        <td>{formatDate(e.fechaIngreso)}</td>
                        <td><StatusChip status={e.activo ? 'Activo' : 'Inactivo'} /></td>
                        <td>
                          <div className="em-actions">
                            <button type="button" className="btn btn--ghost btn--sm btn--icon-only" onClick={() => abrirEdicion(e)} aria-label={`Editar ${e.nombre}`}>
                              <Icon name="edit" size={12} />
                            </button>
                            {e.activo && (
                              <button type="button" className="btn btn--ghost btn--sm btn--icon-only" onClick={() => setADesactivar(e)} aria-label={`Desactivar ${e.nombre}`}>
                                <Icon name="trash" size={12} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {pagina && (
            <Pagination page={pagina.page} totalPages={pagina.totalPages} totalElements={pagina.totalElements} onPage={setPage} />
          )}
        </main>
      </div>

      <Modal
        isOpen={modalAbierto}
        onClose={cerrarModal}
        eyebrow={editando ? 'Edición de registro' : 'Alta de registro'}
        title={editando ? 'Editar empleado' : 'Nuevo empleado'}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
            <button type="button" className="btn btn--primary" onClick={guardar} disabled={guardando}>
              <Icon name="check" size={13} />
              {guardando ? 'Guardando…' : 'Guardar empleado'}
            </button>
          </>
        }
      >
        {errorGeneral && <div className="em-banner" role="alert">{errorGeneral}</div>}
        <div className="em-grid">
          <Campo id="em-nombre" label="Nombre completo *" error={errores.nombre} full>
            <input id="em-nombre" type="text" className={`form-input ${errores.nombre ? 'form-input--error' : ''}`} value={form.nombre} onChange={campo('nombre')} />
          </Campo>
          <Campo id="em-tipo" label="Tipo de documento *" error={errores.tipoDocumento}>
            <select id="em-tipo" className="form-select" value={form.tipoDocumento} onChange={campo('tipoDocumento')}>
              {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Campo>
          <Campo id="em-documento" label="Documento *" error={errores.documento}>
            <input id="em-documento" type="text" className={`form-input ${errores.documento ? 'form-input--error' : ''}`} value={form.documento} onChange={campo('documento')} />
          </Campo>
          <Campo id="em-cargo" label="Cargo *" error={errores.cargo}>
            <input id="em-cargo" type="text" className={`form-input ${errores.cargo ? 'form-input--error' : ''}`} value={form.cargo} onChange={campo('cargo')} />
          </Campo>
          <Campo id="em-grupo" label="Grupo" error={errores.grupoId}>
            <select id="em-grupo" className="form-select" value={form.grupoId} onChange={campo('grupoId')}>
              <option value="">Toda la empresa</option>
              {gruposDelForm.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </Campo>
          <Campo id="em-email" label="Correo electrónico" error={errores.email}>
            <input id="em-email" type="email" className={`form-input ${errores.email ? 'form-input--error' : ''}`} value={form.email} onChange={campo('email')} />
          </Campo>
          <Campo id="em-telefono" label="Teléfono" error={errores.telefono}>
            <input id="em-telefono" type="tel" className={`form-input ${errores.telefono ? 'form-input--error' : ''}`} value={form.telefono} onChange={campo('telefono')} />
          </Campo>
          <Campo id="em-ingreso" label="Fecha de ingreso" error={errores.fechaIngreso}>
            <input id="em-ingreso" type="date" className="form-input" value={form.fechaIngreso} onChange={campo('fechaIngreso')} />
          </Campo>
          <div className="form-group">
            <label className="em-check" htmlFor="em-activo">
              <input id="em-activo" type="checkbox" checked={form.activo} onChange={campo('activo')} />
              Empleado activo
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!aDesactivar}
        onClose={() => setADesactivar(null)}
        eyebrow="Confirmación requerida"
        title="Desactivar empleado"
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
        <p style={{ fontSize: '14px', color: 'var(--ink-2)', lineHeight: '1.6' }}>
          ¿Deseas <strong>desactivar</strong> a {aDesactivar?.nombre}? El registro se marcará como inactivo y no se elimina;
          puedes reactivarlo después desde su edición.
        </p>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={cerrarToast} />}
    </div>
  )
}

function EmpleadosPage() {
  const { puedeVerEmpleados } = useAuth()
  return puedeVerEmpleados ? <EmpleadosContenido /> : <Restringido />
}

export default EmpleadosPage
