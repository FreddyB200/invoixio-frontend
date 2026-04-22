/**
 * FacturasPage.jsx - Modulo de facturacion electronica
 * Lista facturas existentes y permite crear nuevas con calculo de IVA en tiempo real
 *
 * Requerimientos: RF-03 (crear facturas) y RF-04 (consultar historial)
 * Prototipo: GA6-AA3-EV02 — Seccion 2.3 Formulario de Creacion de Factura
 * Hook custom: useInvoiceCalculator para logica de calculo
 */

import { useState, useMemo } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import { Modal, Toast, StatusChip } from '../components/SharedComponents.jsx'
import { facturas as facturasData, clientes, productos, formatCurrency, formatDate } from '../data.js'

// Tasa de IVA colombiana vigente
const IVA_RATE = 0.19

function FacturasPage() {
  const [facturas, setFacturas] = useState(facturasData)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [search, setSearch]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [lineas, setLineas]     = useState([])
  const [clienteId, setClienteId] = useState('')
  const [modalEstado, setModalEstado] = useState(null) // { id, estado }
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [toast, setToast]       = useState(null)

  // Calcular totales de la factura en tiempo real
  const totales = useMemo(() => {
    const subtotal = lineas.reduce((acc, l) => {
      const prod = productos.find(p => p.id === parseInt(l.productoId))
      if (!prod) return acc
      return acc + prod.precio * l.cantidad * (1 - l.descuento / 100)
    }, 0)
    return { subtotal, iva: subtotal * IVA_RATE, total: subtotal * (1 + IVA_RATE) }
  }, [lineas])

  // Filtrado del historial
  const filtradas = useMemo(() =>
    facturas.filter(f =>
      (f.numero.toLowerCase().includes(search.toLowerCase()) || f.cliente.toLowerCase().includes(search.toLowerCase())) &&
      (!filtroEstado || f.estado === filtroEstado)
    ), [facturas, search, filtroEstado])

  // Agregar linea de producto al formulario
  const agregarLinea = () => setLineas(prev => [...prev, { productoId: '', cantidad: 1, descuento: 0 }])

  // Actualizar campo de una linea especifica
  const actualizarLinea = (i, campo, valor) =>
    setLineas(prev => prev.map((l, idx) => idx === i ? { ...l, [campo]: valor } : l))

  // Eliminar linea del formulario
  const eliminarLinea = (i) => setLineas(prev => prev.filter((_, idx) => idx !== i))

  // Guardar nueva factura
  const guardarFactura = () => {
    if (!clienteId) { setToast({ message: 'Selecciona un cliente', type: 'error' }); return }
    if (lineas.filter(l => l.productoId).length === 0) { setToast({ message: 'Agrega al menos un producto', type: 'error' }); return }

    const cliente = clientes.find(c => c.id === parseInt(clienteId))
    const num = `FV-2026-0${(35 + facturas.length + 1).toString().padStart(3, '0')}`

    setFacturas(prev => [{
      id: Date.now(), numero: num,
      cliente: cliente.razonSocial,
      fecha: new Date().toISOString().split('T')[0],
      total: totales.total, estado: 'Emitida'
    }, ...prev])

    setMostrarForm(false); setLineas([]); setClienteId('')
    setToast({ message: `Factura ${num} creada exitosamente`, type: 'success' })
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Facturacion" />
        <main className="page-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1>Gestion de Facturas</h1>
              <p>Crea, consulta y gestiona el ciclo de vida de tus facturas</p>
            </div>
            <button className="btn btn--primary" onClick={() => { setMostrarForm(!mostrarForm); if (!mostrarForm && lineas.length === 0) agregarLinea() }}>
              {mostrarForm ? '✕ Cerrar' : '+ Nueva Factura'}
            </button>
          </div>

          {/* Formulario nueva factura (colapsable) */}
          {mostrarForm && (
            <div className="card" style={{ marginBottom: '24px', overflow: 'hidden' }}>
              {/* Encabezado del formulario */}
              <div style={{ background: 'linear-gradient(135deg, #0f2057, #1a3a8f)', color: 'white', padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontFamily: 'Sora, sans-serif' }}>Nueva Factura</strong>
                  <span style={{ marginLeft: '16px', opacity: 0.7, fontSize: '13px' }}>N° FV-2026-0{(35 + facturas.length + 1).toString().padStart(3, '0')}</span>
                </div>
                <span style={{ opacity: 0.7, fontSize: '13px' }}>
                  {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>

              <div className="card__body">
                {/* Selector de cliente */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="cliente-select">Cliente *</label>
                    <select id="cliente-select" className="form-select" value={clienteId} onChange={e => setClienteId(e.target.value)}>
                      <option value="">— Selecciona un cliente —</option>
                      {clientes.filter(c => c.activo).map(c => (
                        <option key={c.id} value={c.id}>{c.razonSocial} — {c.nit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tabla de lineas de factura */}
                <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                  <table style={{ fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--gray-50)' }}>
                        <th style={{ width: '40%' }}>Producto / Servicio</th>
                        <th style={{ width: '10%' }}>Cant.</th>
                        <th style={{ width: '18%' }}>Precio Unitario</th>
                        <th style={{ width: '10%' }}>Desc. %</th>
                        <th style={{ width: '18%', textAlign: 'right' }}>Subtotal</th>
                        <th style={{ width: '4%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineas.map((l, i) => {
                        const prod = productos.find(p => p.id === parseInt(l.productoId))
                        const subtotalLinea = prod ? prod.precio * l.cantidad * (1 - l.descuento / 100) : 0
                        return (
                          <tr key={i}>
                            <td>
                              <select className="form-select" style={{ border: 'none', background: 'transparent', padding: '4px 0' }}
                                value={l.productoId} onChange={e => actualizarLinea(i, 'productoId', e.target.value)}>
                                <option value="">— Seleccionar —</option>
                                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                              </select>
                            </td>
                            <td>
                              <input type="number" min="1" style={{ border: 'none', background: 'transparent', width: '60px', textAlign: 'right' }}
                                value={l.cantidad} onChange={e => actualizarLinea(i, 'cantidad', parseInt(e.target.value) || 1)} />
                            </td>
                            <td style={{ color: 'var(--gray-500)' }}>
                              {prod ? formatCurrency(prod.precio) : '—'}
                            </td>
                            <td>
                              <input type="number" min="0" max="100" style={{ border: 'none', background: 'transparent', width: '50px', textAlign: 'right' }}
                                value={l.descuento} onChange={e => actualizarLinea(i, 'descuento', parseFloat(e.target.value) || 0)} />
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '600' }}>
                              {subtotalLinea ? formatCurrency(subtotalLinea) : '—'}
                            </td>
                            <td>
                              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0 4px' }}
                                onClick={() => eliminarLinea(i)} aria-label="Eliminar linea">✕</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <button className="btn btn--secondary btn--sm" onClick={agregarLinea} style={{ marginBottom: '20px' }}>
                  + Agregar linea
                </button>

                {/* Panel de totales y acciones */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {/* Totales calculados en tiempo real */}
                  <div style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: '10px', padding: '16px 20px', minWidth: '260px' }}>
                    {[
                      { label: 'Subtotal', value: formatCurrency(totales.subtotal) },
                      { label: 'IVA (19%)', value: formatCurrency(totales.iva) },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '13.5px' }}>
                        <span>{label}</span><span>{value}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: '2px solid var(--gray-300)', marginTop: '4px', fontFamily: 'Sora, sans-serif', fontWeight: '700', fontSize: '16px', color: 'var(--navy)' }}>
                      <span>TOTAL</span><span>{formatCurrency(totales.total)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button className="btn btn--secondary" onClick={() => { setMostrarForm(false); setLineas([]); setClienteId('') }}>Cancelar</button>
                  <button className="btn btn--primary" onClick={guardarFactura}>💾 Guardar Factura</button>
                </div>
              </div>
            </div>
          )}

          {/* Filtros del historial */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card__body" style={{ padding: '14px 20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-wrap">
                <span className="search-wrap__icon">🔍</span>
                <input type="search" className="search-input" placeholder="Buscar factura o cliente..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="form-select" style={{ width: 'auto', padding: '8px 12px' }} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                {['Emitida', 'Pagada', 'Vencida', 'Anulada'].map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>

          {/* Tabla historial */}
          <div className="card">
            <div className="card__header">
              <span className="card__title">Historial de Facturas</span>
              <span style={{ fontSize: '13px', color: 'var(--gray-400)' }}>{filtradas.length} factura(s)</span>
            </div>
            <div className="card__body" style={{ padding: 0 }}>
              <table aria-label="Historial de facturas">
                <thead>
                  <tr>
                    <th>N° Factura</th><th>Cliente</th><th>Fecha</th>
                    <th style={{ textAlign: 'right' }}>Total</th><th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(f => (
                    <tr key={f.id}>
                      <td><strong style={{ fontFamily: 'Sora, sans-serif', fontSize: '13px' }}>{f.numero}</strong></td>
                      <td>{f.cliente}</td>
                      <td style={{ fontSize: '13px' }}>{formatDate(f.fecha)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', fontFamily: 'Sora, sans-serif' }}>{formatCurrency(f.total)}</td>
                      <td><StatusChip status={f.estado} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn--secondary btn--sm"
                          onClick={() => { setModalEstado({ id: f.id, estado: f.estado }); setNuevoEstado(f.estado) }}
                          aria-label={`Cambiar estado de ${f.numero}`}
                        >🔄 Estado</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal cambio de estado */}
      {modalEstado && (
        <Modal isOpen={!!modalEstado} onClose={() => setModalEstado(null)} title="Cambiar Estado de Factura"
          footer={
            <>
              <button className="btn btn--secondary" onClick={() => setModalEstado(null)}>Cancelar</button>
              <button className="btn btn--primary" onClick={() => {
                setFacturas(prev => prev.map(f => f.id === modalEstado.id ? { ...f, estado: nuevoEstado } : f))
                setModalEstado(null)
                setToast({ message: `Estado actualizado a: ${nuevoEstado}`, type: 'success' })
              }}>Aplicar</button>
            </>
          }
        >
          <p style={{ fontSize: '13.5px', marginBottom: '14px', color: 'var(--gray-600)' }}>
            Estado actual: <StatusChip status={modalEstado.estado} />
          </p>
          <div className="form-group">
            <label className="form-label" htmlFor="nuevo-estado">Nuevo estado</label>
            <select id="nuevo-estado" className="form-select" value={nuevoEstado} onChange={e => setNuevoEstado(e.target.value)}>
              {['Emitida', 'Pagada', 'Vencida', 'Anulada'].map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default FacturasPage
