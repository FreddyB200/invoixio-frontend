/**
 * DashboardPage — editorial executive overview.
 * Headline KPIs, weekly ledger chart, activity feed, quick actions.
 */

import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import Icon from '../components/Icon.jsx'
import { KPICard, StatusChip } from '../components/SharedComponents.jsx'
import { facturas, clientes, formatCurrency } from '../data.js'

const VENTAS_SEMANA = [
  { dia: 'LUN', valor: 1800000 },
  { dia: 'MAR', valor: 3200000 },
  { dia: 'MIÉ', valor: 2100000 },
  { dia: 'JUE', valor: 4500000 },
  { dia: 'VIE', valor: 2900000 },
  { dia: 'SÁB', valor: 3800000 },
  { dia: 'HOY', valor: 2450000 },
]
const MAX_VENTA = Math.max(...VENTAS_SEMANA.map(v => v.valor))
const TOTAL_SEMANA = VENTAS_SEMANA.reduce((a, v) => a + v.valor, 0)
const AVG_SEMANA = TOTAL_SEMANA / VENTAS_SEMANA.length

const ACTIVIDAD = [
  { kind: 'factura',  text: 'Factura FV-2026-0035 emitida · Comercial Andina',          time: 'hace 10 min' },
  { kind: 'pagada',   text: 'Factura FV-2026-0031 marcada como Pagada',                  time: 'hace 1 h'    },
  { kind: 'stock',    text: 'Stock crítico · Monitor 27" Full HD (3 uds.)',              time: 'hace 2 h'    },
  { kind: 'cliente',  text: 'Nuevo cliente registrado · Tech Solutions Colombia',        time: 'hace 3 h'    },
]

const KIND_META = {
  factura: { label: 'I', color: 'var(--ink)',      bg: 'var(--paper-2)'    },
  pagada:  { label: '✓', color: 'var(--moss)',     bg: 'var(--moss-wash)'  },
  stock:   { label: '!', color: 'var(--oxblood)',  bg: 'var(--oxblood-wash)'},
  cliente: { label: '§', color: 'var(--slate)',    bg: 'var(--slate-wash)' },
}

const QUICK_ACTIONS = [
  { icon: 'document', label: 'Nueva factura',      meta: 'FV — 2026',    path: '/facturas',   primary: true },
  { icon: 'users',    label: 'Registrar cliente',  meta: 'Directorio',    path: '/clientes'  },
  { icon: 'package',  label: 'Agregar producto',   meta: 'Catálogo',      path: '/inventario' },
  { icon: 'spark',    label: 'Reporte de cartera', meta: 'PDF · XLSX',    path: '/facturas'  },
]

function DashboardPage() {
  const navigate = useNavigate()

  const ventasHoy = 2450000
  const facturasEmitidas   = facturas.filter(f => f.estado === 'Emitida').length
  const facturasPendientes = facturas.filter(f => f.estado !== 'Pagada').length
  const clientesActivos    = clientes.filter(c => c.activo).length

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Resumen General" eyebrow="Mesa de Trabajo · Vol. I" />

        <style>{`
          .dash-hero {
            display: grid;
            grid-template-columns: 2.3fr 1fr;
            gap: 20px;
            margin-bottom: 22px;
          }
          .dash-hero__headline {
            border-top: 1px solid var(--rule);
            padding-top: 22px;
            margin-bottom: 24px;
          }
          .dash-hero__eyebrow {
            font-family: var(--font-mono);
            font-size: 10px;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            color: var(--ink-4);
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 14px;
          }
          .dash-hero__eyebrow::after {
            content: "";
            flex: 1;
            height: 1px;
            background: var(--rule);
          }
          .dash-hero__title {
            font-family: var(--font-serif);
            font-variation-settings: "SOFT" 30;
            font-size: 44px;
            font-weight: 400;
            letter-spacing: -0.025em;
            line-height: 1.02;
            color: var(--ink);
            max-width: 780px;
          }
          .dash-hero__title em {
            font-style: italic;
            color: var(--oxblood);
          }
          .dash-hero__byline {
            display: flex;
            gap: 20px;
            margin-top: 14px;
            font-family: var(--font-mono);
            font-size: 10.5px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--ink-4);
          }

          .dash-row {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }

          .chart {
            padding: 26px 26px 22px;
          }
          .chart__head {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 28px;
          }
          .chart__totals {
            display: flex;
            gap: 32px;
          }
          .chart__total-label {
            font-family: var(--font-mono);
            font-size: 10px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: var(--ink-4);
            display: block;
            margin-bottom: 4px;
          }
          .chart__total-val {
            font-family: var(--font-mono);
            font-size: 20px;
            font-weight: 500;
            color: var(--ink);
            letter-spacing: -0.01em;
          }
          .chart__total-delta {
            font-family: var(--font-mono);
            font-size: 10.5px;
            color: var(--moss);
            margin-left: 6px;
            font-weight: 500;
          }

          .chart__grid {
            position: relative;
            height: 220px;
            border-bottom: 1px solid var(--ink);
          }
          .chart__gridline {
            position: absolute;
            left: 0; right: 0;
            height: 1px;
            background: var(--rule-soft);
          }
          .chart__gridline-label {
            position: absolute;
            left: 0;
            transform: translateY(-50%);
            font-family: var(--font-mono);
            font-size: 9.5px;
            color: var(--ink-5);
            letter-spacing: 0.08em;
            padding-right: 10px;
            background: var(--surface);
          }

          .chart__bars {
            position: absolute;
            inset: 0 0 0 48px;
            display: flex;
            align-items: flex-end;
            gap: 22px;
            padding: 4px 0;
          }

          .chart__bar-col {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            height: 100%;
            justify-content: flex-end;
            position: relative;
          }

          .chart__bar-val {
            font-family: var(--font-mono);
            font-size: 10px;
            font-weight: 500;
            color: var(--ink-3);
            letter-spacing: 0.02em;
          }
          .chart__bar-col--today .chart__bar-val { color: var(--oxblood); font-weight: 600; }

          .chart__bar {
            width: 100%;
            max-width: 52px;
            background: var(--ink);
            position: relative;
            transition: height .4s cubic-bezier(.2,.7,.2,1);
          }
          .chart__bar::after {
            content: "";
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: rgba(255,255,255,0.18);
          }

          .chart__bar-col--today .chart__bar { background: var(--oxblood); }

          .chart__labels {
            display: flex;
            gap: 22px;
            padding: 10px 0 0 48px;
          }
          .chart__label {
            flex: 1;
            text-align: center;
            font-family: var(--font-mono);
            font-size: 10px;
            font-weight: 500;
            letter-spacing: 0.16em;
            color: var(--ink-4);
          }
          .chart__label--today { color: var(--oxblood); }

          /* Por cobrar */
          .due {
            padding: 0;
          }
          .due__row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 20px;
            border-bottom: 1px solid var(--rule-soft);
            gap: 12px;
          }
          .due__row:last-child { border-bottom: none; }
          .due__num {
            font-family: var(--font-mono);
            font-size: 10px;
            color: var(--ink-4);
            letter-spacing: 0.12em;
          }
          .due__client {
            font-size: 13px;
            color: var(--ink);
            font-weight: 500;
            line-height: 1.25;
          }
          .due__amount {
            font-family: var(--font-mono);
            font-size: 13px;
            color: var(--ink);
            font-weight: 500;
            text-align: right;
          }

          /* Activity */
          .feed {
            padding: 4px 20px 10px;
          }
          .feed__item {
            display: grid;
            grid-template-columns: 28px 1fr auto;
            gap: 14px;
            align-items: flex-start;
            padding: 14px 0;
            border-bottom: 1px solid var(--rule-soft);
          }
          .feed__item:last-child { border-bottom: none; }
          .feed__mark {
            width: 28px;
            height: 28px;
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: var(--font-serif);
            font-size: 13px;
            font-weight: 500;
            border: 1px solid var(--rule);
          }
          .feed__text {
            font-size: 13px;
            color: var(--ink-2);
            line-height: 1.5;
          }
          .feed__time {
            font-family: var(--font-mono);
            font-size: 10px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--ink-4);
            white-space: nowrap;
            padding-top: 2px;
          }

          /* Quick actions */
          .qa-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1px;
            background: var(--rule);
            border: 1px solid var(--rule);
          }
          .qa {
            background: var(--surface);
            padding: 18px 20px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
            cursor: pointer;
            border: none;
            text-align: left;
            color: var(--ink);
            transition: background .15s ease;
            font-family: var(--font-sans);
          }
          .qa:hover { background: var(--paper); }

          .qa__icon {
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--rule);
            border-radius: 2px;
            color: var(--ink);
            background: var(--paper);
            margin-bottom: 6px;
          }
          .qa--primary .qa__icon {
            background: var(--ink);
            border-color: var(--ink);
            color: var(--paper);
          }

          .qa__label {
            font-size: 14px;
            font-weight: 500;
            font-family: var(--font-serif);
            letter-spacing: -0.005em;
            color: var(--ink);
          }
          .qa__meta {
            font-family: var(--font-mono);
            font-size: 9.5px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: var(--ink-4);
          }

          @media (max-width: 1080px) {
            .dash-hero, .dash-row { grid-template-columns: 1fr; }
          }
        `}</style>

        <main className="page-content">

          {/* Editorial hero headline */}
          <div className="dash-hero__headline">
            <div className="dash-hero__eyebrow">
              <span>Edición Diaria</span>
              <span>·</span>
              <span>Consolidado Operativo</span>
            </div>
            <h1 className="dash-hero__title">
              Estado <em>corriente</em> del libro de ventas y cartera.
            </h1>
            <div className="dash-hero__byline">
              <span>Actualizado hoy, 09:42</span>
              <span>·</span>
              <span>Moneda: COP</span>
              <span>·</span>
              <span>IVA 19 %</span>
            </div>
          </div>

          {/* KPI ledger */}
          <div className="kpi-grid stagger">
            <KPICard
              label="Ventas del día"
              value={formatCurrency(ventasHoy)}
              num="N° 01"
              trend={{ dir: 'up', text: '+15 % vs. ayer' }}
              accent="oxblood"
            />
            <KPICard
              label="Facturas emitidas"
              value={facturasEmitidas}
              num="N° 02"
              trend={{ dir: 'up', text: 'Mes en curso' }}
              accent="ink"
            />
            <KPICard
              label="Pendientes de cobro"
              value={facturasPendientes}
              num="N° 03"
              trend={{ dir: 'warn', text: 'Por gestionar' }}
              accent="amber"
            />
            <KPICard
              label="Clientes activos"
              value={clientesActivos}
              num="N° 04"
              trend={{ dir: 'up', text: 'En directorio' }}
              accent="moss"
            />
          </div>

          {/* Chart + Due */}
          <div className="dash-row">
            <div className="card">
              <div className="card__header">
                <div className="card__title-wrap">
                  <span className="card__eyebrow">Figura 01</span>
                  <span className="card__title">Tendencia de <em>ventas</em> — últimos 7 días</span>
                </div>
                <span className="card__meta">Abril MMXXVI</span>
              </div>
              <div className="chart">
                <div className="chart__head">
                  <div className="chart__totals">
                    <div>
                      <span className="chart__total-label">Acumulado</span>
                      <span className="chart__total-val">
                        {formatCurrency(TOTAL_SEMANA)}
                        <span className="chart__total-delta">+12.4 %</span>
                      </span>
                    </div>
                    <div>
                      <span className="chart__total-label">Promedio diario</span>
                      <span className="chart__total-val">{formatCurrency(Math.round(AVG_SEMANA))}</span>
                    </div>
                  </div>
                </div>

                <div className="chart__grid" role="img" aria-label="Gráfico de barras de ventas semanales">
                  {[0, 25, 50, 75, 100].map(pct => (
                    <div key={pct} className="chart__gridline" style={{ bottom: `${pct}%` }}>
                      <span className="chart__gridline-label">
                        {(MAX_VENTA * pct / 100 / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  ))}

                  <div className="chart__bars">
                    {VENTAS_SEMANA.map(item => {
                      const pct = (item.valor / MAX_VENTA) * 100
                      const isToday = item.dia === 'HOY'
                      return (
                        <div
                          key={item.dia}
                          className={`chart__bar-col ${isToday ? 'chart__bar-col--today' : ''}`}
                          title={`${item.dia}: ${formatCurrency(item.valor)}`}
                        >
                          <span className="chart__bar-val">
                            {(item.valor / 1000000).toFixed(1)}
                          </span>
                          <div className="chart__bar" style={{ height: `${pct}%`, minHeight: '6px' }} />
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="chart__labels">
                  {VENTAS_SEMANA.map(item => (
                    <span
                      key={item.dia}
                      className={`chart__label ${item.dia === 'HOY' ? 'chart__label--today' : ''}`}
                    >
                      {item.dia}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card__header">
                <div className="card__title-wrap">
                  <span className="card__eyebrow">Cartera</span>
                  <span className="card__title">Por cobrar</span>
                </div>
                <button className="btn btn--ghost btn--sm" onClick={() => navigate('/facturas')}>
                  Ver todas <Icon name="chevron-right" size={11} />
                </button>
              </div>
              <div className="due">
                {facturas.filter(f => f.estado !== 'Pagada').slice(0, 4).map(f => (
                  <div key={f.id} className="due__row">
                    <div>
                      <div className="due__client">{f.cliente.split(' ').slice(0, 2).join(' ')}</div>
                      <div className="due__num">{f.numero}</div>
                    </div>
                    <div>
                      <div className="due__amount">{formatCurrency(f.total)}</div>
                      <div style={{ textAlign: 'right', marginTop: 4 }}>
                        <StatusChip status={f.estado} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity + Quick actions */}
          <div className="dash-row">
            <div className="card">
              <div className="card__header">
                <div className="card__title-wrap">
                  <span className="card__eyebrow">Registro</span>
                  <span className="card__title">Actividad reciente</span>
                </div>
                <span className="card__meta">Últimas 24 h</span>
              </div>
              <div className="feed">
                {ACTIVIDAD.map((a, i) => {
                  const meta = KIND_META[a.kind] || KIND_META.factura
                  return (
                    <div key={i} className="feed__item">
                      <div
                        className="feed__mark"
                        style={{
                          background: meta.bg,
                          color: meta.color,
                          borderColor: 'transparent',
                        }}
                      >
                        {meta.label}
                      </div>
                      <div className="feed__text">{a.text}</div>
                      <div className="feed__time">{a.time}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card">
              <div className="card__header">
                <div className="card__title-wrap">
                  <span className="card__eyebrow">Atajos</span>
                  <span className="card__title">Accesos rápidos</span>
                </div>
              </div>
              <div className="qa-grid">
                {QUICK_ACTIONS.map(a => (
                  <button
                    key={a.label}
                    className={`qa ${a.primary ? 'qa--primary' : ''}`}
                    onClick={() => navigate(a.path)}
                  >
                    <span className="qa__icon">
                      <Icon name={a.icon} size={16} />
                    </span>
                    <span className="qa__label">{a.label}</span>
                    <span className="qa__meta">{a.meta}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}

export default DashboardPage
