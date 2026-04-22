/**
 * FacturasPage — ledger of invoices with creation flow.
 */

import { useState, useMemo } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import Icon from '../components/Icon.jsx'
import { Modal, Toast, StatusChip } from '../components/SharedComponents.jsx'
import { facturas as facturasData, clientes, productos, formatCurrency, formatDate } from '../data.js'

const IVA_RATE = 0.19

function FacturasPage() {
  const [facturas, setFacturas] = useState(facturasData)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [search, setSearch]     = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [lineas, setLineas]     = useState([])
  const [clienteId, setClienteId] = useState('')
  const [modalEstado, setModalEstado] = useState(null)
  const [nuevoEstado, setNuevoEstado] = useState('')
  const [toast, setToast]       = useState(null)

  const totales = useMemo(() => {
    const subtotal = lineas.reduce((acc, l) => {
      const prod = productos.find(p => p.id === parseInt(l.productoId))
      if (!prod) return acc
      return acc + prod.precio * l.cantidad * (1 - l.descuento / 100)
    }, 0)
    return { subtotal, iva: subtotal * IVA_RATE, total: subtotal * (1 + IVA_RATE) }
  }, [lineas])

  const filtradas = useMemo(() =>
    facturas.filter(f =>
      (f.numero.toLowerCase().includes(search.toLowerCase()) || f.cliente.toLowerCase().includes(search.toLowerCase())) &&
      (!filtroEstado || f.estado === filtroEstado)
    ), [facturas, search, filtroEstado])

  const agregarLinea = () => setLineas(prev => [...prev, { productoId: '', cantidad: 1, descuento: 0 }])
  const actualizarLinea = (i, campo, valor) =>
    setLineas(prev => prev.map((l, idx) => idx === i ? { ...l, [campo]: valor } : l))
  const eliminarLinea = (i) => setLineas(prev => prev.filter((_, idx) => idx !== i))

  const nextNumero = `FV-2026-0${(35 + facturas.length + 1).toString().padStart(3, '0')}`

  const guardarFactura = () => {
    if (!clienteId) { setToast({ message: 'Selecciona un cliente', type: 'error' }); return }
    if (lineas.filter(l => l.productoId).length === 0) { setToast({ message: 'Agrega al menos un producto', type: 'error' }); return }

    const cliente = clientes.find(c => c.id === parseInt(clienteId))
    const num = nextNumero

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
        <Topbar title="Facturación" eyebrow="Módulo II · Operaciones" />

        <style>{`
          .invoice-form {
            margin-bottom: 28px;
            overflow: hidden;
            animation: slideUp 0.25s cubic-bezier(.2,.7,.2,1);
          }
          .invoice-form__banner {
            background: var(--ink);
            color: var(--paper);
            padding: 20px 26px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
          }
          .invoice-form__banner-left {
            display: flex;
            flex-direction: column;
            gap: 3px;
          }
          .invoice-form__banner-eyebrow {
            font-family: var(--font-mono);
            font-size: 9.5px;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            color: #c8bea8;
          }
          .invoice-form__banner-title {
            font-family: var(--font-serif);
            font-size: 22px;
            font-weight: 500;
            letter-spacing: -0.01em;
          }
          .invoice-form__banner-title em {
            font-style: italic;
            color: #e8b596;
          }
          .invoice-form__banner-meta {
            text-align: right;
            font-family: var(--font-mono);
            font-size: 10px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #c8bea8;
            line-height: 1.5;
          }
          .invoice-form__banner-meta strong {
            display: block;
            font-family: var(--font-mono);
            font-size: 14px;
            color: var(--paper);
            letter-spacing: 0.04em;
          }

          .invoice-form__lines {
            width: 100%;
            border-collapse: collapse;
          }
          .invoice-form__lines thead tr {
            border-bottom: 1px solid var(--ink);
          }
          .invoice-form__lines th {
            padding: 8px 10px;
            background: transparent;
          }
          .invoice-form__lines td {
            padding: 8px 10px;
            border-bottom: 1px dashed var(--rule);
          }
          .invoice-form__lines select,
          .invoice-form__lines input {
            width: 100%;
            border: none;
            background: transparent;
            outline: none;
            font-family: var(--font-sans);
            font-size: 13px;
            padding: 6px 4px;
            color: var(--ink);
          }
          .invoice-form__lines select:focus,
          .invoice-form__lines input:focus {
            background: var(--paper-2);
            border-radius: 2px;
          }
          .invoice-form__lines .num-field {
            font-family: var(--font-mono);
            text-align: right;
          }
          .invoice-form__lines .ll-sub {
            font-family: var(--font-mono);
            text-align: right;
            font-weight: 500;
            color: var(--ink);
          }
          .invoice-form__lines .ll-delete {
            background: none;
            border: none;
            color: var(--ink-4);
            cursor: pointer;
            padding: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          .invoice-form__lines .ll-delete:hover { color: var(--oxblood); }

          .invoice-form__addline {
            margin: 16px 0 22px;
            font-family: var(--font-mono);
            font-size: 10.5px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
          }

          .invoice-totals {
            display: flex;
            justify-content: flex-end;
            margin-top: 18px;
          }
          .invoice-totals__box {
            min-width: 320px;
            background: var(--paper);
            border: 1px solid var(--ink);
            padding: 18px 22px;
          }
          .invoice-totals__row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 13px;
            color: var(--ink-2);
          }
          .invoice-totals__row span:last-child {
            font-family: var(--font-mono);
            color: var(--ink);
          }
          .invoice-totals__total {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            padding-top: 12px;
            margin-top: 8px;
            border-top: 1px solid var(--ink);
          }
          .invoice-totals__total-label {
            font-family: var(--font-mono);
            font-size: 10px;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: var(--ink-3);
          }
          .invoice-totals__total-value {
            font-family: var(--font-mono);
            font-size: 24px;
            font-weight: 600;
            color: var(--ink);
            letter-spacing: -0.01em;
          }

          .invoice-form__actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: 22px;
            padding-top: 20px;
            border-top: 1px solid var(--rule-soft);
          }

          .fv-num {
            font-family: var(--font-mono);
            font-size: 12.5px;
            font-weight: 500;
            letter-spacing: 0.04em;
            color: var(--ink);
          }
        `}</style>

        <main className="page-content">

          {/* Page header */}
          <div className="page-header">
            <div className="page-header__left">
              <span className="page-header__eyebrow">
                Módulo II <span>·</span> Facturación electrónica
              </span>
              <h1>Gestión de <em>facturas</em></h1>
              <p>Emite, consulta y actualiza el ciclo de vida de las facturas de venta bajo la normativa DIAN.</p>
            </div>
            <button
              className="btn btn--primary"
              onClick={() => { setMostrarForm(!mostrarForm); if (!mostrarForm && lineas.length === 0) agregarLinea() }}
            >
              <Icon name={mostrarForm ? 'close' : 'plus'} size={13} />
              {mostrarForm ? 'Cerrar borrador' : 'Nueva factura'}
            </button>
          </div>

          {/* Form */}
          {mostrarForm && (
            <div className="card invoice-form">
              <div className="invoice-form__banner">
                <div className="invoice-form__banner-left">
                  <span className="invoice-form__banner-eyebrow">Borrador · Factura de venta</span>
                  <span className="invoice-form__banner-title">Documento <em>electrónico</em></span>
                </div>
                <div className="invoice-form__banner-meta">
                  <strong>{nextNumero}</strong>
                  <span>{new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="card__body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="cliente-select">Cliente *</label>
                    <select
                      id="cliente-select"
                      className="form-select"
                      value={clienteId}
                      onChange={e => setClienteId(e.target.value)}
                    >
                      <option value="">— Selecciona un cliente —</option>
                      {clientes.filter(c => c.activo).map(c => (
                        <option key={c.id} value={c.id}>{c.razonSocial} — {c.nit}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Condición de pago</label>
                    <select className="form-select" defaultValue="contado">
                      <option value="contado">Contado</option>
                      <option value="credito-15">Crédito 15 días</option>
                      <option value="credito-30">Crédito 30 días</option>
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="invoice-form__lines">
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>Producto / Servicio</th>
                        <th style={{ width: '10%', textAlign: 'right' }}>Cant.</th>
                        <th style={{ width: '18%', textAlign: 'right' }}>P. Unitario</th>
                        <th style={{ width: '10%', textAlign: 'right' }}>Desc. %</th>
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
                              <select
                                value={l.productoId}
                                onChange={e => actualizarLinea(i, 'productoId', e.target.value)}
                              >
                                <option value="">— Seleccionar producto —</option>
                                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                className="num-field"
                                value={l.cantidad}
                                onChange={e => actualizarLinea(i, 'cantidad', parseInt(e.target.value) || 1)}
                              />
                            </td>
                            <td className="num-field" style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                              {prod ? formatCurrency(prod.precio) : '—'}
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                className="num-field"
                                value={l.descuento}
                                onChange={e => actualizarLinea(i, 'descuento', parseFloat(e.target.value) || 0)}
                              />
                            </td>
                            <td className="ll-sub">
                              {subtotalLinea ? formatCurrency(subtotalLinea) : '—'}
                            </td>
                            <td>
                              <button
                                className="ll-delete"
                                onClick={() => eliminarLinea(i)}
                                aria-label="Eliminar línea"
                              >
                                <Icon name="close" size={13} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <button
                  className="btn btn--ghost btn--sm invoice-form__addline"
                  onClick={agregarLinea}
                >
                  <Icon name="plus" size={12} />
                  Agregar línea
                </button>

                <div className="invoice-totals">
                  <div className="invoice-totals__box">
                    <div className="invoice-totals__row">
                      <span>Subtotal</span><span>{formatCurrency(totales.subtotal)}</span>
                    </div>
                    <div className="invoice-totals__row">
                      <span>IVA (19 %)</span><span>{formatCurrency(totales.iva)}</span>
                    </div>
                    <div className="invoice-totals__total">
                      <span className="invoice-totals__total-label">Total COP</span>
                      <span className="invoice-totals__total-value">{formatCurrency(totales.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="invoice-form__actions">
                  <button
                    className="btn btn--ghost"
                    onClick={() => { setMostrarForm(false); setLineas([]); setClienteId('') }}
                  >
                    Cancelar
                  </button>
                  <button className="btn btn--primary" onClick={guardarFactura}>
                    <Icon name="check" size={13} />
                    Emitir factura
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-wrap__icon">
                <Icon name="search" size={14} />
              </span>
              <input
                type="search"
                className="search-input"
                placeholder="Buscar por factura o cliente…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '8px 14px' }}
              value={filtroEstado}
              onChange={e => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {['Emitida', 'Pagada', 'Vencida', 'Anulada'].map(e => <option key={e}>{e}</option>)}
            </select>
            <span className="toolbar__count">
              <strong>{filtradas.length.toString().padStart(2, '0')}</strong> factura(s)
            </span>
          </div>

          {/* Table */}
          <div className="card">
            <div className="card__header">
              <div className="card__title-wrap">
                <span className="card__eyebrow">Libro auxiliar</span>
                <span className="card__title">Historial de <em>facturas</em></span>
              </div>
              <span className="card__meta">Ordenado por fecha desc.</span>
            </div>
            <div className="card__body" style={{ padding: 0 }}>
              <table aria-label="Historial de facturas">
                <thead>
                  <tr>
                    <th>N° Factura</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map(f => (
                    <tr key={f.id}>
                      <td><span className="fv-num">{f.numero}</span></td>
                      <td>{f.cliente}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ink-3)' }}>
                        {formatDate(f.fecha)}
                      </td>
                      <td className="num-cell">{formatCurrency(f.total)}</td>
                      <td><StatusChip status={f.estado} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn--ghost btn--sm"
                          onClick={() => { setModalEstado({ id: f.id, estado: f.estado }); setNuevoEstado(f.estado) }}
                          aria-label={`Cambiar estado de ${f.numero}`}
                        >
                          <Icon name="refresh" size={11} />
                          Estado
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {modalEstado && (
        <Modal
          isOpen={!!modalEstado}
          onClose={() => setModalEstado(null)}
          eyebrow="Actualización de estado"
          title="Cambiar estado de factura"
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setModalEstado(null)}>Cancelar</button>
              <button className="btn btn--primary" onClick={() => {
                setFacturas(prev => prev.map(f => f.id === modalEstado.id ? { ...f, estado: nuevoEstado } : f))
                setModalEstado(null)
                setToast({ message: `Estado actualizado a: ${nuevoEstado}`, type: 'success' })
              }}>
                Aplicar cambio
              </button>
            </>
          }
        >
          <p style={{ fontSize: '13px', marginBottom: '16px', color: 'var(--ink-3)' }}>
            Estado actual: <StatusChip status={modalEstado.estado} />
          </p>
          <div className="form-group">
            <label className="form-label" htmlFor="nuevo-estado">Nuevo estado</label>
            <select
              id="nuevo-estado"
              className="form-select"
              value={nuevoEstado}
              onChange={e => setNuevoEstado(e.target.value)}
            >
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
