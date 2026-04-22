/**
 * ClientesPage.jsx - Modulo de gestion de clientes
 * CRUD completo: listar, crear, editar y desactivar clientes
 * Busqueda en tiempo real por nombre o NIT
 *
 * Requerimiento funcional: RF-05 — Gestion del directorio de clientes
 * Prototipo de referencia: GA6-AA3-EV02 — Seccion 2.4 Modulo Clientes
 * Estandar: Componentes controlados con hooks useState
 */

import { useState, useMemo } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import { Modal, Toast, StatusChip } from '../components/SharedComponents.jsx'
import { clientes as clientesData } from '../data.js'

// Estado inicial para el formulario de cliente
const EMPTY_FORM = { razonSocial: '', nit: '', email: '', telefono: '', ciudad: '' }

function ClientesPage() {
  // Estado principal: lista de clientes (mutable)
  const [clientes, setClientes] = useState(clientesData)
  const [search, setSearch]     = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [errors, setErrors]     = useState({})
  const [toast, setToast]       = useState(null)

  // Filtrado en tiempo real con useMemo para optimizar renders
  const filtrados = useMemo(() =>
    clientes.filter(c =>
      c.razonSocial.toLowerCase().includes(search.toLowerCase()) ||
      c.nit.includes(search)
    ), [clientes, search])

  // Abrir modal de creacion
  const handleNuevo = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  // Abrir modal de edicion con datos precargados
  const handleEditar = (cliente) => {
    setEditId(cliente.id)
    setForm({ razonSocial: cliente.razonSocial, nit: cliente.nit, email: cliente.email, telefono: cliente.telefono, ciudad: cliente.ciudad })
    setErrors({})
    setModalOpen(true)
  }

  // Validacion del formulario antes de guardar
  const validate = () => {
    const e = {}
    if (!form.razonSocial.trim()) e.razonSocial = 'La razon social es obligatoria'
    if (!form.nit.trim()) e.nit = 'El NIT es obligatorio'
    return e
  }

  // Guardar cliente (crear o actualizar)
  const handleGuardar = () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }

    if (editId) {
      // Actualizar cliente existente
      setClientes(prev => prev.map(c => c.id === editId ? { ...c, ...form } : c))
      setToast({ message: 'Cliente actualizado correctamente', type: 'success' })
    } else {
      // Crear nuevo cliente
      const nuevo = { id: Date.now(), ...form, activo: true, facturas: 0 }
      setClientes(prev => [...prev, nuevo])
      setToast({ message: 'Cliente registrado exitosamente', type: 'success' })
    }
    setModalOpen(false)
  }

  // Confirmar desactivacion
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
        <Topbar title="Gestion de Clientes" />

        <main className="page-content">
          {/* Header de pagina */}
          <div className="page-header">
            <div>
              <h1>Clientes</h1>
              <p>Directorio de clientes registrados en el sistema</p>
            </div>
            <button className="btn btn--primary" onClick={handleNuevo}>
              + Nuevo cliente
            </button>
          </div>

          {/* Barra de busqueda */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card__body" style={{ padding: '14px 20px' }}>
              <div className="search-wrap">
                <span className="search-wrap__icon">🔍</span>
                <input
                  type="search"
                  className="search-input"
                  placeholder="Buscar por nombre o NIT..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Buscar clientes"
                />
              </div>
              <span style={{ marginLeft: '16px', fontSize: '13px', color: 'var(--gray-400)' }}>
                {filtrados.length} cliente(s) encontrado(s)
              </span>
            </div>
          </div>

          {/* Tabla de clientes */}
          <div className="card">
            <div className="card__body" style={{ padding: 0 }}>
              <table aria-label="Lista de clientes">
                <thead>
                  <tr>
                    <th>Razon Social</th>
                    <th>NIT</th>
                    <th>Contacto</th>
                    <th>Ciudad</th>
                    <th>Facturas</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{c.razonSocial}</div>
                        <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{c.email}</div>
                      </td>
                      <td><code style={{ fontSize: '12px', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: '4px' }}>{c.nit}</code></td>
                      <td style={{ fontSize: '13px' }}>{c.telefono}</td>
                      <td>{c.ciudad}</td>
                      <td style={{ fontWeight: '600', color: 'var(--accent)' }}>{c.facturas}</td>
                      <td><StatusChip status={c.activo ? 'Activo' : 'Inactivo'} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn btn--secondary btn--sm" onClick={() => handleEditar(c)} aria-label={`Editar ${c.razonSocial}`}>✏️</button>
                          <button className="btn btn--secondary btn--sm" onClick={() => handleDesactivar(c.id)} aria-label={`Desactivar ${c.razonSocial}`}>🗑️</button>
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

      {/* Modal creacion/edicion */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? 'Editar Cliente' : 'Nuevo Cliente'}
        footer={
          <>
            <button className="btn btn--secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn btn--primary" onClick={handleGuardar}>Guardar cliente</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="razonSocial">Razon Social *</label>
            <input id="razonSocial" type="text" className={`form-input ${errors.razonSocial ? 'form-input--error' : ''}`}
              value={form.razonSocial} onChange={e => setForm(p => ({ ...p, razonSocial: e.target.value }))} />
            {errors.razonSocial && <span className="error-msg" role="alert">{errors.razonSocial}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="nit">NIT *</label>
            <input id="nit" type="text" className={`form-input ${errors.nit ? 'form-input--error' : ''}`}
              placeholder="900.123.456-1" value={form.nit} onChange={e => setForm(p => ({ ...p, nit: e.target.value }))} />
            {errors.nit && <span className="error-msg" role="alert">{errors.nit}</span>}
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Correo electronico</label>
            <input id="email" type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="telefono">Telefono</label>
            <input id="telefono" type="tel" className="form-input" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ciudad">Ciudad</label>
            <input id="ciudad" type="text" className="form-input" value={form.ciudad} onChange={e => setForm(p => ({ ...p, ciudad: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Modal confirmacion desactivacion */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar accion"
        footer={
          <>
            <button className="btn btn--secondary" onClick={() => setConfirmOpen(false)}>Cancelar</button>
            <button className="btn btn--primary" style={{ background: '#ef4444' }} onClick={confirmarDesactivar}>Si, desactivar</button>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: 'var(--gray-600)', lineHeight: '1.6' }}>
          ¿Estas seguro de que deseas <strong>desactivar</strong> este cliente?<br/>
          No se eliminaran sus facturas historicas.
        </p>
      </Modal>

      {/* Toast de notificacion */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default ClientesPage
