/**
 * ClientesPage — directory of business clients with CRUD flow.
 */

import { useState, useMemo } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import Icon from '../components/Icon.jsx'
import { Modal, Toast, StatusChip } from '../components/SharedComponents.jsx'
import { clientes as clientesData } from '../data.js'

const EMPTY_FORM = { razonSocial: '', nit: '', email: '', telefono: '', ciudad: '' }

function ClientesPage() {
  const [clientes, setClientes] = useState(clientesData)
  const [search, setSearch]     = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [errors, setErrors]     = useState({})
  const [toast, setToast]       = useState(null)

  const filtrados = useMemo(() =>
    clientes.filter(c =>
      c.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
      c.nit.includes(search)
    ), [clientes, search])

  const activos = clientes.filter(c => c.activo).length

  const handleNuevo = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  const handleEditar = (cliente) => {
    setEditId(cliente.id)
    setForm({
      razonSocial: cliente.razonSocial,
      nit: cliente.nit,
      email: cliente.email,
      telefono: cliente.telefono,
      ciudad: cliente.ciudad,
    })
    setErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const e = {}
    if (!form.razonSocial.trim()) e.razonSocial = 'La razón social es obligatoria'
    if (!form.nit.trim()) e.nit = 'El NIT es obligatorio'
    return e
  }

  const handleGuardar = () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    if (editId) {
      setClientes(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c))
      setToast({ message: 'Cliente actualizado correctamente', type: 'success' })
    } else {
      const nuevo = { id: Date.now(), ...form, activo: true, facturas: 0 }
      setClientes(prev => [...prev, nuevo])
      setToast({ message: 'Cliente registrado exitosamente', type: 'success' })
    }
    setModalOpen(false)
  }

  const handleDesactivar = (id) => { setDeletingId(id); setConfirmOpen(true) }

  const confirmarDesactivar = () => {
    setClientes(prev => prev.map(c => c.id === deletingId ? { ...c, activo: false } : c))
    setConfirmOpen(false)
    setToast({ message: 'Cliente desactivado', type: 'success' })
  }

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
          .cl-email {
            font-family: var(--font-mono);
            font-size: 11px;
            color: var(--ink-4);
            margin-top: 2px;
          }
          .cl-facturas {
            font-family: var(--font-mono);
            font-weight: 500;
            color: var(--ink);
            text-align: center;
          }
          .cl-action-row {
            display: flex;
            gap: 6px;
            justify-content: flex-end;
          }
        `}</style>

        <main className="page-content">

          <div className="page-header">
            <div className="page-header__left">
              <span className="page-header__eyebrow">Módulo III · Directorio</span>
              <h1>Clientes <em>registrados</em></h1>
              <p>Gestiona la información fiscal y de contacto de las empresas con las que operas.</p>
            </div>
            <button className="btn btn--primary" onClick={handleNuevo}>
              <Icon name="plus" size={13} />
              Nuevo cliente
            </button>
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-wrap__icon"><Icon name="search" size={14} /></span>
              <input
                type="search"
                className="search-input"
                placeholder="Buscar por razón social o NIT…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Buscar clientes"
              />
            </div>
            <span className="toolbar__count">
              <strong>{filtrados.length.toString().padStart(2, '0')}</strong> resultado(s) · <strong>{activos}</strong> activos
            </span>
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
              <table aria-label="Lista de clientes">
                <thead>
                  <tr>
                    <th>Razón social</th>
                    <th>NIT</th>
                    <th>Contacto</th>
                    <th>Ciudad</th>
                    <th style={{ textAlign: 'center' }}>Facturas</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div className="cl-name">{c.razonSocial}</div>
                        <div className="cl-email">{c.email}</div>
                      </td>
                      <td><code className="code-chip">{c.nit}</code></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{c.telefono}</td>
                      <td>{c.ciudad}</td>
                      <td className="cl-facturas">{String(c.facturas).padStart(2, '0')}</td>
                      <td><StatusChip status={c.activo ? 'Activo' : 'Inactivo'} /></td>
                      <td>
                        <div className="cl-action-row">
                          <button
                            className="btn btn--ghost btn--sm btn--icon-only"
                            onClick={() => handleEditar(c)}
                            aria-label={`Editar ${c.razonSocial}`}
                          >
                            <Icon name="edit" size={12} />
                          </button>
                          <button
                            className="btn btn--ghost btn--sm btn--icon-only"
                            onClick={() => handleDesactivar(c.id)}
                            aria-label={`Desactivar ${c.razonSocial}`}
                          >
                            <Icon name="trash" size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        eyebrow={editId ? 'Edición de registro' : 'Alta de registro'}
        title={editId ? 'Editar cliente' : 'Nuevo cliente'}
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn--primary" onClick={handleGuardar}>
              <Icon name="check" size={13} />
              Guardar cliente
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="razonSocial">Razón social *</label>
            <input
              id="razonSocial"
              type="text"
              className={`form-input ${errors.razonSocial ? 'form-input--error' : ''}`}
              value={form.razonSocial}
              onChange={e => setForm(p => ({ ...p, razonSocial: e.target.value }))}
            />
            {errors.razonSocial && <span className="error-msg" role="alert">{errors.razonSocial}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="nit">NIT *</label>
            <input
              id="nit"
              type="text"
              className={`form-input ${errors.nit ? 'form-input--error' : ''}`}
              placeholder="900.123.456-1"
              value={form.nit}
              onChange={e => setForm(p => ({ ...p, nit: e.target.value }))}
            />
            {errors.nit && <span className="error-msg" role="alert">{errors.nit}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              type="tel"
              className="form-input"
              value={form.telefono}
              onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ciudad">Ciudad</label>
            <input
              id="ciudad"
              type="text"
              className="form-input"
              value={form.ciudad}
              onChange={e => setForm(p => ({ ...p, ciudad: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        eyebrow="Confirmación requerida"
        title="Desactivar cliente"
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setConfirmOpen(false)}>Cancelar</button>
            <button className="btn btn--danger" onClick={confirmarDesactivar}>
              <Icon name="warning" size={13} />
              Sí, desactivar
            </button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--ink-2)', lineHeight: '1.6' }}>
          ¿Deseas <strong>desactivar</strong> este cliente? El registro se marcará como inactivo y dejará de aparecer en los selectores de facturación.
          <br/><br/>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--ink-4)', letterSpacing: '0.06em' }}>
            — Las facturas históricas permanecen intactas.
          </span>
        </p>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default ClientesPage
