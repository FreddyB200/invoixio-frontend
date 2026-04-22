/**
 * InventarioPage.jsx - Modulo de control de inventario
 * Catalogo de productos con alertas de stock critico y ajuste de movimientos
 *
 * Requerimiento funcional: RF-06 — Control de inventario y stock
 * Prototipo de referencia: GA6-AA3-EV02 — Seccion 2.5 Modulo Inventario
 * Logica: semaforo de stock (verde >= 15, amarillo 5-14, rojo < 5)
 */

import { useState, useMemo } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import { Modal, Toast, KPICard } from '../components/SharedComponents.jsx'
import { productos as productosData, formatCurrency } from '../data.js'

// Umbral de stock critico segun reglas de negocio
const STOCK_CRITICO = 5
const STOCK_BAJO = 15

// Determina el chip de stock segun el nivel
const stockChip = (stock) => {
  if (stock <= 0) return { label: 'Sin stock', color: '#ef4444', bg: '#fef2f2' }
  if (stock < STOCK_CRITICO) return { label: `⚠ ${stock}`, color: '#ef4444', bg: '#fef2f2' }
  if (stock < STOCK_BAJO) return { label: String(stock), color: '#f59e0b', bg: '#fffbeb' }
  return { label: String(stock), color: '#10b981', bg: '#ecfdf5' }
}

const CATEGORIAS = ['Software', 'Servicios', 'Hardware']
const CAT_COLORS = { Software: '#eff6ff', Servicios: '#ecfdf5', Hardware: '#fffbeb' }

function InventarioPage() {
  const [productos, setProductos] = useState(productosData)
  const [search, setSearch]       = useState('')
  const [filtroCat, setFiltroCat] = useState('')
  const [soloCritico, setSoloCritico] = useState(false)
  const [modalProducto, setModalProducto] = useState(false)
  const [modalStock, setModalStock] = useState(null) // { id, nombre, stock }
  const [editId, setEditId]       = useState(null)
  const [form, setForm]           = useState({ codigo: '', nombre: '', precio: '', stock: '', categoria: 'Software' })
  const [ajuste, setAjuste]       = useState({ tipo: 'entrada', cantidad: '' })
  const [toast, setToast]         = useState(null)

  // KPIs del inventario
  const kpis = useMemo(() => ({
    total: productos.length,
    criticos: productos.filter(p => p.stock < STOCK_CRITICO).length,
    valorTotal: productos.reduce((acc, p) => acc + p.precio * p.stock, 0),
  }), [productos])

  // Filtrado en tiempo real
  const filtrados = useMemo(() =>
    productos.filter(p =>
      (p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase())) &&
      (!filtroCat || p.categoria === filtroCat) &&
      (!soloCritico || p.stock < STOCK_CRITICO)
    ), [productos, search, filtroCat, soloCritico])

  // Abrir modal de nuevo producto
  const handleNuevo = () => {
    setEditId(null)
    setForm({ codigo: '', nombre: '', precio: '', stock: '', categoria: 'Software' })
    setModalProducto(true)
  }

  // Abrir modal de edicion
  const handleEditar = (p) => {
    setEditId(p.id)
    setForm({ codigo: p.codigo, nombre: p.nombre, precio: String(p.precio), stock: String(p.stock), categoria: p.categoria })
    setModalProducto(true)
  }

  // Guardar producto
  const guardarProducto = () => {
    if (!form.codigo || !form.nombre || !form.precio) {
      setToast({ message: 'Completa los campos obligatorios', type: 'error' }); return
    }
    const datos = { codigo: form.codigo, nombre: form.nombre, precio: parseFloat(form.precio), stock: parseInt(form.stock) || 0, categoria: form.categoria }

    if (editId) {
      setProductos(prev => prev.map(p => p.id === editId ? { ...p, ...datos } : p))
      setToast({ message: 'Producto actualizado correctamente', type: 'success' })
    } else {
      setProductos(prev => [...prev, { id: Date.now(), ...datos }])
      setToast({ message: 'Producto agregado al catalogo', type: 'success' })
    }
    setModalProducto(false)
  }

  // Aplicar ajuste de stock
  const aplicarAjuste = () => {
    const cant = parseInt(ajuste.cantidad) || 0
    if (cant < 1) { setToast({ message: 'Ingresa una cantidad valida', type: 'error' }); return }

    setProductos(prev => prev.map(p => {
      if (p.id !== modalStock.id) return p
      const nuevoStock = ajuste.tipo === 'entrada' ? p.stock + cant : Math.max(0, p.stock - cant)
      return { ...p, stock: nuevoStock }
    }))

    const prod = productos.find(p => p.id === modalStock.id)
    const nuevoStock = ajuste.tipo === 'entrada' ? prod.stock + cant : Math.max(0, prod.stock - cant)
    setModalStock(null)
    setToast({ message: `Stock ajustado. Nuevo stock: ${nuevoStock} unidades`, type: 'success' })
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Inventario de Productos" />
        <main className="page-content">

          {/* Header */}
          <div className="page-header">
            <div>
              <h1>Inventario de Productos</h1>
              <p>Catalogo de productos y servicios disponibles para facturar</p>
            </div>
            <button className="btn btn--primary" onClick={handleNuevo}>+ Agregar producto</button>
          </div>

          {/* KPIs del inventario */}
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
            <KPICard label="Total Productos" value={kpis.total} badge="En catalogo" badgeType="blue" />
            <KPICard label="Stock Critico" value={kpis.criticos} badge={`< ${STOCK_CRITICO} unidades`} badgeType="red" />
            <KPICard label="Valor en Inventario" value={formatCurrency(kpis.valorTotal)} badge="Estimado" badgeType="green" />
          </div>

          {/* Filtros */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card__body" style={{ padding: '14px 20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-wrap">
                <span className="search-wrap__icon">🔍</span>
                <input type="search" className="search-input" placeholder="Buscar por nombre o codigo..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="form-select" style={{ width: 'auto', padding: '8px 12px' }} value={filtroCat} onChange={e => setFiltroCat(e.target.value)}>
                <option value="">Todas las categorias</option>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={soloCritico} onChange={e => setSoloCritico(e.target.checked)} />
                Solo stock critico
              </label>
            </div>
          </div>

          {/* Tabla de productos */}
          <div className="card">
            <div className="card__body" style={{ padding: 0 }}>
              <table aria-label="Catalogo de productos">
                <thead>
                  <tr>
                    <th>Codigo</th><th>Nombre del producto</th><th>Categoria</th>
                    <th style={{ textAlign: 'right' }}>Precio Unitario</th>
                    <th style={{ textAlign: 'center' }}>Stock</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(p => {
                    const chip = stockChip(p.stock)
                    return (
                      <tr key={p.id} style={{ background: p.stock < STOCK_CRITICO ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                        <td><code style={{ fontSize: '12px', background: 'var(--gray-100)', padding: '2px 7px', borderRadius: '4px' }}>{p.codigo}</code></td>
                        <td><strong>{p.nombre}</strong></td>
                        <td>
                          <span style={{ background: CAT_COLORS[p.categoria], padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: 'var(--gray-700)' }}>
                            {p.categoria}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '700', fontFamily: 'Sora, sans-serif', fontSize: '13px' }}>{formatCurrency(p.precio)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ background: chip.bg, color: chip.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                            {chip.label}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button className="btn btn--secondary btn--sm"
                              onClick={() => { setModalStock({ id: p.id, nombre: p.nombre, stock: p.stock }); setAjuste({ tipo: 'entrada', cantidad: '' }) }}
                              aria-label={`Ajustar stock de ${p.nombre}`}>📦</button>
                            <button className="btn btn--secondary btn--sm" onClick={() => handleEditar(p)} aria-label={`Editar ${p.nombre}`}>✏️</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal agregar/editar producto */}
      <Modal isOpen={modalProducto} onClose={() => setModalProducto(false)} title={editId ? 'Editar Producto' : 'Agregar Producto'}
        footer={
          <>
            <button className="btn btn--secondary" onClick={() => setModalProducto(false)}>Cancelar</button>
            <button className="btn btn--primary" onClick={guardarProducto}>Guardar producto</button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="cod">Codigo *</label>
            <input id="cod" type="text" className="form-input" placeholder="SFT-001" value={form.codigo} onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cat">Categoria *</label>
            <select id="cat" className="form-select" value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="nom">Nombre del producto *</label>
            <input id="nom" type="text" className="form-input" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="prec">Precio Unitario (COP) *</label>
            <input id="prec" type="number" className="form-input" min="0" value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="stk">Stock inicial</label>
            <input id="stk" type="number" className="form-input" min="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
          </div>
        </div>
      </Modal>

      {/* Modal ajuste de stock */}
      {modalStock && (
        <Modal isOpen={!!modalStock} onClose={() => setModalStock(null)} title="Ajustar Stock"
          footer={
            <>
              <button className="btn btn--secondary" onClick={() => setModalStock(null)}>Cancelar</button>
              <button className="btn btn--primary" onClick={aplicarAjuste}>Aplicar ajuste</button>
            </>
          }
        >
          <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '14px' }}>
            {modalStock.nombre} — Stock actual: <strong>{modalStock.stock} unidades</strong>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="tipo-mov">Tipo de movimiento</label>
              <select id="tipo-mov" className="form-select" value={ajuste.tipo} onChange={e => setAjuste(a => ({ ...a, tipo: e.target.value }))}>
                <option value="entrada">Entrada (sumar)</option>
                <option value="salida">Salida (restar)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cant-ajuste">Cantidad *</label>
              <input id="cant-ajuste" type="number" className="form-input" min="1" value={ajuste.cantidad} onChange={e => setAjuste(a => ({ ...a, cantidad: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default InventarioPage
