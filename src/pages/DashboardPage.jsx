/**
 * DashboardPage.jsx - Pagina principal del sistema Invoixio
 * Muestra metricas clave, actividad reciente y accesos rapidos
 *
 * Requerimiento funcional: RF-02 — Visualizacion de metricas del negocio
 * Prototipo de referencia: GA6-AA3-EV02 — Seccion 2.2 Mesa de Trabajo
 * Componentes utilizados: KPICard, Sidebar, Topbar
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import { KPICard } from '../components/SharedComponents.jsx'
import { facturas, clientes, formatCurrency } from '../data.js'

// Datos estaticos del grafico de ventas (simulando respuesta API)
const VENTAS_SEMANA = [
  { dia: 'Lu', valor: 1800000 },
  { dia: 'Ma', valor: 3200000 },
  { dia: 'Mi', valor: 2100000 },
  { dia: 'Ju', valor: 4500000 },
  { dia: 'Vi', valor: 2900000 },
  { dia: 'Sa', valor: 3800000 },
  { dia: 'Hoy', valor: 2450000 },
]

const MAX_VENTA = Math.max(...VENTAS_SEMANA.map(v => v.valor))

// Actividad reciente del sistema
const ACTIVIDAD = [
  { icon: '📄', text: 'Factura FV-2026-0035 creada — Comercial Andina', time: 'hace 10 min', color: '#eff6ff' },
  { icon: '✅', text: 'Factura FV-2026-0031 marcada como Pagada', time: 'hace 1 h', color: '#ecfdf5' },
  { icon: '⚠️', text: 'Stock critico: Monitor 27" Full HD (3 und.)', time: 'hace 2 h', color: '#fffbeb' },
  { icon: '👤', text: 'Nuevo cliente: Tech Solutions Colombia', time: 'hace 3 h', color: '#eff6ff' },
]

function DashboardPage() {
  const navigate = useNavigate()

  // Calcular metricas en tiempo real desde los datos
  const ventasHoy = 2450000
  const facturasEmitidas = facturas.filter(f => f.estado === 'Emitida').length
  const facturasPendientes = facturas.filter(f => f.estado !== 'Pagada').length

  return (
    <div className="layout">
      <Sidebar />

      <div className="main-wrap">
        <Topbar title="Resumen General" />

        <main className="page-content">

          {/* KPIs principales — RF-02 */}
          <div className="kpi-grid">
            <KPICard
              label="Ventas del Dia"
              value={formatCurrency(ventasHoy)}
              badge="↑ +15% vs ayer"
              badgeType="green"
            />
            <KPICard
              label="Facturas Emitidas"
              value={facturasEmitidas}
              badge="Este mes"
              badgeType="blue"
            />
            <KPICard
              label="Facturas Pendientes"
              value={facturasPendientes}
              badge="⚠ Por cobrar"
              badgeType="yellow"
            />
            <KPICard
              label="Clientes Activos"
              value={clientes.filter(c => c.activo).length}
              badge="En directorio"
              badgeType="blue"
            />
          </div>

          {/* Fila inferior: grafico + actividad */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>

            {/* Grafico de barras — ventas semanales */}
            <div className="card">
              <div className="card__header">
                <span className="card__title">Tendencia de Ventas — Ultimos 7 dias</span>
                <span style={{ fontSize: '12px', color: 'var(--gray-400)' }}>Abril 2026</span>
              </div>
              <div className="card__body">
                {/* Grafico de barras con CSS */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '120px' }}>
                  {VENTAS_SEMANA.map((item, i) => {
                    const pct = (item.valor / MAX_VENTA) * 100
                    const isToday = item.dia === 'Hoy'
                    return (
                      <div key={item.dia} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '9px', fontWeight: '600', color: 'var(--gray-500)' }}>
                          {(item.valor / 1000000).toFixed(1)}M
                        </span>
                        <div
                          title={`${item.dia}: ${formatCurrency(item.valor)}`}
                          style={{
                            width: '100%',
                            height: `${pct}%`,
                            background: isToday
                              ? 'linear-gradient(180deg, #f59e0b, #d97706)'
                              : 'linear-gradient(180deg, #3b82f6, #1a3a8f)',
                            borderRadius: '4px 4px 0 0',
                            minHeight: '6px',
                          }}
                        />
                        <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{item.dia}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Facturas pendientes de pago */}
            <div className="card">
              <div className="card__header">
                <span className="card__title">Por Cobrar</span>
                <button className="btn btn--secondary btn--sm" onClick={() => navigate('/facturas')}>
                  Ver todas
                </button>
              </div>
              <div className="card__body" style={{ padding: '12px 16px' }}>
                {facturas.filter(f => f.estado !== 'Pagada').slice(0, 3).map(f => (
                  <div key={f.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 0', borderBottom: '1px solid var(--gray-100)',
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{f.cliente.split(' ').slice(0, 2).join(' ')}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{f.numero}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>{formatCurrency(f.total)}</div>
                      <span className={`chip chip--${f.estado === 'Vencida' ? 'red' : 'yellow'}`} style={{ fontSize: '10px' }}>
                        {f.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fila: actividad + accesos rapidos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Actividad reciente */}
            <div className="card">
              <div className="card__header">
                <span className="card__title">Actividad Reciente</span>
              </div>
              <div className="card__body" style={{ padding: '8px 16px' }}>
                {ACTIVIDAD.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 0', borderBottom: i < ACTIVIDAD.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                    <div style={{ width: '32px', height: '32px', background: a.color, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                      {a.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-700)' }}>{a.text}</div>
                      <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accesos rapidos */}
            <div className="card">
              <div className="card__header">
                <span className="card__title">Accesos Rapidos</span>
              </div>
              <div className="card__body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { icon: '📄', label: 'Nueva Factura', path: '/facturas', primary: true },
                    { icon: '👤', label: 'Nuevo Cliente', path: '/clientes' },
                    { icon: '📦', label: 'Agregar Producto', path: '/inventario' },
                    { icon: '📈', label: 'Ver Reportes', path: '/facturas' },
                  ].map(a => (
                    <button
                      key={a.label}
                      className={`btn ${a.primary ? 'btn--primary' : 'btn--secondary'}`}
                      style={{ flexDirection: 'column', height: '80px', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '12px' }}
                      onClick={() => navigate(a.path)}
                    >
                      <span style={{ fontSize: '22px' }}>{a.icon}</span>
                      <span style={{ fontSize: '12px' }}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}

export default DashboardPage
