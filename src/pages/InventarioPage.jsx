/**
 * InventarioPage — product catalog with stock signaling & movements.
 */

import { useState, useMemo } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import Icon from '../components/Icon.jsx'
import { Modal, Toast, KPICard } from '../components/SharedComponents.jsx'
import { productos as productosData, formatCurrency } from '../data.js'

const STOCK_CRITICO = 5
const STOCK_BAJO = 15

const stockChipClass = (stock) => {
  if (stock <= 0) return 'chip chip--red'
  if (stock < STOCK_CRITICO) return 'chip chip--red'
  if (stock < STOCK_BAJO) return 'chip chip--yellow'
  return 'chip chip--green'
}

const CATEGORIAS = ['Software', 'Servicios', 'Hardware']

const CAT_META = {
  Software:  { dot: 'var(--slate)',   label: 'SW' },
  Servicios: { dot: 'var(--moss)',    label: 'SV' },
  Hardware:  { dot: 'var(--amber)',   label: 'HW' },
}

function InventarioPage() {
  const [productos, setProductos] = useState(productosData)
  const [search, setSearch]       = useState('')
  const [filtroCat, setFiltroCat] = useState('')
  const [soloCritico, setSoloCritico] = useState(false)
  const [modalProducto, setModalProducto] = useState(false)
  const [modalStock, setModalStock] = useState(null)
  const [editId, setEditId]       = useState(null)
  const [form, setForm]           = useState({ codigo: '', nombre: '', precio: '', stock: '', categoria: 'Software' })
  const [ajuste, setAjuste]       = useState({ tipo: 'entrada', cantidad: '' })
  const [toast, setToast]         = useState(null)

  const kpis = useMemo(() => ({
    total: productos.length,
    criticos: productos.filter(p => p.stock < STOCK_CRITICO).length,
    valorTotal: productos.reduce((acc, p) => acc + p.precio * p.stock, 0),
  }), [productos])

  const filtrados = useMemo(() =>
    productos.filter(p =>
      (p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase())) &&
      (!filtroCat || p.categoria === filtroCat) &&
      (!soloCritico || p.stock < STOCK_CRITICO)
    ), [productos, search, filtroCat, soloCritico])

  const handleNuevo = () => {
    setEditId(null)
    setForm({ codigo: '', nombre: '', precio: '', stock: '', categoria: 'Software' })
    setModalProducto(true)
  }

  const handleEditar = (p) => {
    setEditId(p.id)
    setForm({ codigo: p.codigo, nombre: p.nombre, precio: String(p.precio), stock: String(p.stock), categoria: p.categoria })
    setModalProducto(true)
  }

  const guardarProducto = () => {
    if (!form.codigo || !form.nombre || !form.precio) {
      setToast({ message: 'Completa los campos obligatorios', type: 'error' }); return
    }
    const datos = {
      codigo: form.codigo,
      nombre: form.nombre,
      precio: parseFloat(form.precio),
      stock: parseInt(form.stock) || 0,
      categoria: form.categoria,
    }

    if (editId) {
      setProductos(prev => prev.map(p => p.id === editId ? { ...p, ...datos } : p))
      setToast({ message: 'Producto actualizado correctamente', type: 'success' })
    } else {
      setProductos(prev => [...prev, { id: Date.now(), ...datos }])
      setToast({ message: 'Producto agregado al catálogo', type: 'success' })
    }
    setModalProducto(false)
  }

  const aplicarAjuste = () => {
    const cant = parseInt(ajuste.cantidad) || 0
    if (cant < 1) { setToast({ message: 'Ingresa una cantidad válida', type: 'error' }); return }

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
        <Topbar title="Inventario" eyebrow="Módulo IV · Catálogo y stock" />

        <style>{`
          .inv-kpi-3 { grid-template-columns: repeat(3, 1fr); }

          .inv-cat {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-family: var(--font-mono);
            font-size: 10.5px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--ink-2);
          }
          .inv-cat::before {
            content: "";
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--dot, var(--ink));
            flex-shrink: 0;
          }

          .inv-row-critical { background: rgba(122, 31, 31, 0.035); }

          .inv-filters-checkbox {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 12.5px;
            color: var(--ink-2);
            cursor: pointer;
            user-select: none;
            padding: 8px 12px;
            border: 1px solid var(--rule);
            border-radius: var(--radius);
            background: var(--surface);
            transition: all .15s;
          }
          .inv-filters-checkbox:hover { border-color: var(--ink-3); }
          .inv-filters-checkbox input {
            accent-color: var(--oxblood);
            margin: 0;
          }

          .inv-action-row {
            display: flex;
            gap: 6px;
            justify-content: flex-end;
          }
        `}</style>

        <main className="page-content">

          <div className="page-header">
            <div className="page-header__left">
              <span className="page-header__eyebrow">Módulo IV · Control de existencias</span>
              <h1>Catálogo de <em>productos</em></h1>
              <p>Mantén actualizado el inventario, detecta stock crítico y registra movimientos de entrada y salida.</p>
            </div>
            <button className="btn btn--primary" onClick={handleNuevo}>
              <Icon name="plus" size={13} />
              Agregar producto
            </button>
          </div>

          <div className="kpi-grid inv-kpi-3">
            <KPICard
              label="Total productos"
              value={String(kpis.total).padStart(2, '0')}
              num="N° 01"
              trend={{ dir: 'up', text: 'En catálogo' }}
              accent="ink"
            />
            <KPICard
              label="Stock crítico"
              value={String(kpis.criticos).padStart(2, '0')}
              num="N° 02"
              trend={{ dir: 'warn', text: `< ${STOCK_CRITICO} unidades` }}
              accent="oxblood"
            />
            <KPICard
              label="Valor en inventario"
              value={formatCurrency(kpis.valorTotal)}
              num="N° 03"
              trend={{ dir: 'up', text: 'Estimado COP' }}
              accent="moss"
            />
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-wrap__icon"><Icon name="search" size={14} /></span>
              <input
                type="search"
                className="search-input"
                placeholder="Buscar por nombre o código…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '8px 14px' }}
              value={filtroCat}
              onChange={e => setFiltroCat(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
            <label className="inv-filters-checkbox">
              <input
                type="checkbox"
                checked={soloCritico}
                onChange={e => setSoloCritico(e.target.checked)}
              />
              Solo stock crítico
            </label>
            <span className="toolbar__count">
              <strong>{filtrados.length.toString().padStart(2, '0')}</strong> producto(s)
            </span>
          </div>

          <div className="card">
            <div className="card__header">
              <div className="card__title-wrap">
                <span className="card__eyebrow">Catálogo</span>
                <span className="card__title">Productos y <em>servicios</em></span>
              </div>
              <span className="card__meta">
                Crítico <span style={{ color: 'var(--oxblood)', fontWeight: 600 }}>●</span>
                &nbsp;&nbsp;Bajo <span style={{ color: 'var(--amber)', fontWeight: 600 }}>●</span>
                &nbsp;&nbsp;Óptimo <span style={{ color: 'var(--moss)', fontWeight: 600 }}>●</span>
              </span>
            </div>
            <div className="card__body" style={{ padding: 0 }}>
              <table aria-label="Catálogo de productos">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre del producto</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: 'right' }}>Precio unitario</th>
                    <th style={{ textAlign: 'center' }}>Stock</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(p => {
                    const cat = CAT_META[p.categoria] || CAT_META.Software
                    const critical = p.stock < STOCK_CRITICO
                    return (
                      <tr key={p.id} className={critical ? 'inv-row-critical' : ''}>
                        <td><code className="code-chip">{p.codigo}</code></td>
                        <td>
                          <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>
                            {p.nombre}
                          </strong>
                        </td>
                        <td>
                          <span className="inv-cat" style={{ '--dot': cat.dot }}>
                            {p.categoria}
                          </span>
                        </td>
                        <td className="num-cell">{formatCurrency(p.precio)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={stockChipClass(p.stock)}>
                            {p.stock <= 0 ? 'Agotado' : p.stock}
                          </span>
                        </td>
                        <td>
                          <div className="inv-action-row">
                            <button
                              className="btn btn--ghost btn--sm"
                              onClick={() => {
                                setModalStock({ id: p.id, nombre: p.nombre, stock: p.stock })
                                setAjuste({ tipo: 'entrada', cantidad: '' })
                              }}
                              aria-label={`Ajustar stock de ${p.nombre}`}
                            >
                              <Icon name="box" size={11} />
                              Stock
                            </button>
                            <button
                              className="btn btn--ghost btn--sm btn--icon-only"
                              onClick={() => handleEditar(p)}
                              aria-label={`Editar ${p.nombre}`}
                            >
                              <Icon name="edit" size={12} />
                            </button>
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

      <Modal
        isOpen={modalProducto}
        onClose={() => setModalProducto(false)}
        eyebrow={editId ? 'Edición de catálogo' : 'Alta de catálogo'}
        title={editId ? 'Editar producto' : 'Agregar producto'}
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setModalProducto(false)}>Cancelar</button>
            <button className="btn btn--primary" onClick={guardarProducto}>
              <Icon name="check" size={13} />
              Guardar producto
            </button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="cod">Código *</label>
            <input
              id="cod"
              type="text"
              className="form-input"
              placeholder="SFT-001"
              value={form.codigo}
              onChange={e => setForm(p => ({ ...p, codigo: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cat">Categoría *</label>
            <select
              id="cat"
              className="form-select"
              value={form.categoria}
              onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
            >
              {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="nom">Nombre del producto *</label>
            <input
              id="nom"
              type="text"
              className="form-input"
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="prec">Precio unitario (COP) *</label>
            <input
              id="prec"
              type="number"
              className="form-input"
              min="0"
              value={form.precio}
              onChange={e => setForm(p => ({ ...p, precio: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="stk">Stock inicial</label>
            <input
              id="stk"
              type="number"
              className="form-input"
              min="0"
              value={form.stock}
              onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {modalStock && (
        <Modal
          isOpen={!!modalStock}
          onClose={() => setModalStock(null)}
          eyebrow="Movimiento de stock"
          title="Ajustar inventario"
          footer={
            <>
              <button className="btn btn--ghost" onClick={() => setModalStock(null)}>Cancelar</button>
              <button className="btn btn--primary" onClick={aplicarAjuste}>
                <Icon name="check" size={13} />
                Aplicar ajuste
              </button>
            </>
          }
        >
          <div style={{
            padding: '12px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--rule)',
            borderRadius: 'var(--radius)',
            marginBottom: '18px',
          }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 500, color: 'var(--ink)' }}>
              {modalStock.nombre}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--ink-4)',
              marginTop: 4,
            }}>
              Stock actual · <strong style={{ color: 'var(--ink)' }}>{modalStock.stock} uds.</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="tipo-mov">Tipo de movimiento</label>
              <select
                id="tipo-mov"
                className="form-select"
                value={ajuste.tipo}
                onChange={e => setAjuste(a => ({ ...a, tipo: e.target.value }))}
              >
                <option value="entrada">Entrada (sumar)</option>
                <option value="salida">Salida (restar)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cant-ajuste">Cantidad *</label>
              <input
                id="cant-ajuste"
                type="number"
                className="form-input"
                min="1"
                value={ajuste.cantidad}
                onChange={e => setAjuste(a => ({ ...a, cantidad: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default InventarioPage
