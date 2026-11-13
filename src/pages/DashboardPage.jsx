/**
 * DashboardPage — resumen ejecutivo del periodo con datos reales de la API.
 * KPIs de clientes, recaudo y cartera, facturas por estado, mayores morosos y facturas por cobrar.
 * Cada bloque carga y falla por separado.
 */

import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import Icon from '../components/Icon.jsx'
import { KPICard, StatusChip } from '../components/SharedComponents.jsx'
import { LoadingState, ErrorState } from '../components/StateViews.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useAsync } from '../hooks/useAsync.js'
import { cargarResumen, MAX_PAGINAS_TOTALES, TAMANO_PAGINA } from '../api/resumen.js'
import { formatCurrency, formatDate, formatPeriodo, periodoActual, ESTADO_FACTURA } from '../utils/format.js'

const BLOQUES = ['clientes', 'conteos', 'totales', 'cartera', 'impagas']

const ROL_LABEL = {
  ADMIN_GENERAL: 'Administrador general',
  ADMIN_EMPRESA: 'Administrador de empresa',
  CONTADOR: 'Contador · vista contable',
}

const BARRAS = [
  { estado: 'BORRADOR', clase: 'borrador' },
  { estado: 'EMITIDA', clase: 'emitida' },
  { estado: 'PAGADA', clase: 'pagada' },
  { estado: 'VENCIDA', clase: 'vencida' },
]

const KIND_META = {
  VENCIDA: { label: '!', color: 'var(--oxblood)', bg: 'var(--oxblood-wash)' },
  EMITIDA: { label: 'I', color: 'var(--ink)', bg: 'var(--paper-2)' },
}

const NO_DISPONIBLE = { dir: 'warn', text: 'No se pudo cargar' }

/** Resuelve un bloque: cargando, error con reintento o su contenido. */
function Bloque({ estado, onRetry, children }) {
  if (!estado) return <LoadingState />
  if (estado.error) return <ErrorState error={estado.error} onRetry={onRetry} />
  return children(estado.data)
}

/** Valor y tendencia de un KPI según el estado del bloque que lo alimenta. */
function kpi(estado, valor, tendencia) {
  if (!estado) return { value: '…', trend: { dir: 'flat', text: 'Cargando' } }
  if (estado.error) return { value: '—', trend: NO_DISPONIBLE }
  return { value: valor(estado.data), trend: tendencia(estado.data) }
}

function DashboardPage() {
  const navigate = useNavigate()
  const { user, empresas, empresaId, esGeneral, puedeVerEmpleados } = useAuth()
  const periodo = periodoActual()
  const { data, error, reload } = useAsync(() => cargarResumen(periodo), [periodo])

  const resumen = data ?? (error ? Object.fromEntries(BLOQUES.map((b) => [b, { error }])) : null)
  const estado = (b) => resumen?.[b]
  const empresa = esGeneral ? empresas?.find((e) => e.id === empresaId)?.nombre : null

  const kClientes = kpi(estado('clientes'), (n) => n, () => ({ dir: 'up', text: 'En directorio' }))
  const kRecaudado = kpi(
    estado('totales'),
    (t) => formatCurrency(t.recaudado),
    (t) => (t.truncado
      ? { dir: 'warn', text: `Parcial: primeras ${MAX_PAGINAS_TOTALES * TAMANO_PAGINA} facturas` }
      : { dir: 'up', text: `De ${formatCurrency(t.facturado)} facturado` }),
  )
  const kPorCobrar = kpi(
    estado('totales'),
    (t) => formatCurrency(t.porCobrar),
    () => ({ dir: 'warn', text: 'Emitidas y vencidas' }),
  )
  const kCartera = kpi(
    estado('cartera'),
    (c) => formatCurrency(c.totalAdeudado),
    (c) => ({ dir: c.totalClientes > 0 ? 'warn' : 'up', text: `${c.totalClientes} ${c.totalClientes === 1 ? 'cliente en mora' : 'clientes en mora'}` }),
  )

  const atajos = [
    { icon: 'document', label: 'Facturar periodo', meta: formatPeriodo(periodo), path: '/facturas', primary: true },
    { icon: 'warning', label: 'Revisar cartera', meta: 'Cobranza', path: '/cartera' },
    { icon: 'users', label: 'Consultar clientes', meta: 'Directorio', path: '/clientes' },
    puedeVerEmpleados
      ? { icon: 'lock', label: 'Gestionar personal', meta: 'Empleados', path: '/empleados' }
      : { icon: 'box', label: 'Ver grupos', meta: 'Conjuntos y sedes', path: '/grupos' },
  ]

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Resumen General" eyebrow="Panel de control" />

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
            letter-spacing: 0.06em;
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
            font-family: var(--font-display);
            font-size: 30px;
            font-weight: 600;
            letter-spacing: -0.025em;
            line-height: 1.02;
            color: var(--ink);
            max-width: 780px;
          }
          .dash-hero__title em {
            font-style: normal;
            color: var(--brand);
          }
          .dash-hero__byline {
            display: flex;
            gap: 20px;
            margin-top: 14px;
            font-family: var(--font-mono);
            font-size: 10.5px;
            letter-spacing: 0.06em;
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
            letter-spacing: 0.06em;
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
            letter-spacing: 0.05em;
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
            letter-spacing: 0.06em;
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
            letter-spacing: 0.05em;
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
            font-family: var(--font-display);
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
            letter-spacing: 0.06em;
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
            font-family: var(--font-display);
            letter-spacing: -0.005em;
            color: var(--ink);
          }
          .qa__meta {
            font-family: var(--font-mono);
            font-size: 9.5px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--ink-4);
          }


          .dash-hero__byline strong { color: var(--ink-2); font-weight: 600; }
          .dash-empty { padding: 28px 20px; text-align: center; font-size: 13px; color: var(--ink-3); }
          .chart__bar--borrador { background: var(--ink-4); }
          .chart__bar--emitida { background: var(--amber); }
          .chart__bar--pagada { background: var(--moss); }
          .chart__bar--vencida { background: var(--oxblood); }
          .due__days { margin-top: 4px; font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.05em; color: var(--oxblood); text-align: right; }

          @media (max-width: 1080px) {
            .dash-hero, .dash-row { grid-template-columns: 1fr; }
          }
        `}</style>
        <main className="page-content">

          <div className="dash-hero__headline">
            <div className="dash-hero__eyebrow">
              <span>Resumen del periodo</span>
              <span>·</span>
              <span>{formatPeriodo(periodo)}</span>
            </div>
            <h1 className="dash-hero__title">
              Estado <em>corriente</em> de la facturación y la cartera{empresa ? ` de ${empresa}` : ''}.
            </h1>
            <div className="dash-hero__byline">
              <span>Hola, <strong>{user?.nombre}</strong></span>
              <span>·</span>
              <span>{ROL_LABEL[user?.rol] ?? 'Usuario'}</span>
              <span>·</span>
              <span>Moneda: COP</span>
            </div>
          </div>

          <div className="kpi-grid stagger">
            <KPICard label="Clientes activos" value={kClientes.value} num="N° 01" trend={kClientes.trend} accent="moss" />
            <KPICard label="Recaudado del periodo" value={kRecaudado.value} num="N° 02" trend={kRecaudado.trend} accent="ink" />
            <KPICard label="Por cobrar del periodo" value={kPorCobrar.value} num="N° 03" trend={kPorCobrar.trend} accent="amber" />
            <KPICard label="Cartera vencida" value={kCartera.value} num="N° 04" trend={kCartera.trend} accent="oxblood" />
          </div>

          <div className="dash-row">
            <div className="card">
              <div className="card__header">
                <div className="card__title-wrap">
                  <span className="card__eyebrow">Gráfico</span>
                  <span className="card__title">Facturas del <em>periodo</em> por estado</span>
                </div>
                <span className="card__meta">{formatPeriodo(periodo)}</span>
              </div>
              <div className="chart">
                <Bloque estado={estado('conteos')} onRetry={reload}>
                  {(conteos) => {
                    const max = Math.max(...BARRAS.map((b) => conteos[b.estado]), 1)
                    return (
                      <>
                        <div className="chart__head">
                          <div className="chart__totals">
                            <div>
                              <span className="chart__total-label">Facturas del periodo</span>
                              <span className="chart__total-val">{conteos.total}</span>
                            </div>
                            <div>
                              <span className="chart__total-label">Pagadas</span>
                              <span className="chart__total-val">
                                {conteos.total > 0 ? Math.round((conteos.PAGADA / conteos.total) * 100) : 0} %
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="chart__grid" role="img" aria-label="Gráfico de barras de facturas del periodo por estado">
                          {[0, 25, 50, 75, 100].map((pct) => (
                            <div key={pct} className="chart__gridline" style={{ bottom: `${pct}%` }}>
                              <span className="chart__gridline-label">{Math.round((max * pct) / 100)}</span>
                            </div>
                          ))}
                          <div className="chart__bars">
                            {BARRAS.map((b) => (
                              <div
                                key={b.estado}
                                className="chart__bar-col"
                                title={`${ESTADO_FACTURA[b.estado]}: ${conteos[b.estado]}`}
                              >
                                <span className="chart__bar-val">{conteos[b.estado]}</span>
                                <div
                                  className={`chart__bar chart__bar--${b.clase}`}
                                  style={{ height: `${(conteos[b.estado] / max) * 100}%`, minHeight: '6px' }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="chart__labels">
                          {BARRAS.map((b) => (
                            <span key={b.estado} className="chart__label">{ESTADO_FACTURA[b.estado].toUpperCase()}</span>
                          ))}
                        </div>
                      </>
                    )
                  }}
                </Bloque>
              </div>
            </div>

            <div className="card">
              <div className="card__header">
                <div className="card__title-wrap">
                  <span className="card__eyebrow">Cartera</span>
                  <span className="card__title">Mayores morosos</span>
                </div>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/cartera')}>
                  Ver cartera <Icon name="chevron-right" size={11} />
                </button>
              </div>
              <div className="due">
                <Bloque estado={estado('cartera')} onRetry={reload}>
                  {(cartera) => (cartera.top.length === 0
                    ? <p className="dash-empty">Sin cartera vencida a la fecha.</p>
                    : cartera.top.map((c) => (
                      <div key={c.cliente.id} className="due__row">
                        <div>
                          <div className="due__client">{c.cliente.nombre}</div>
                          <div className="due__num">
                            {[c.cliente.grupoNombre, c.cliente.unidad].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <div>
                          <div className="due__amount">{formatCurrency(c.totalAdeudado)}</div>
                          <div className="due__days">
                            {c.facturasVencidas} {c.facturasVencidas === 1 ? 'factura' : 'facturas'} · {c.diasMoraMaximo} días de mora
                          </div>
                        </div>
                      </div>
                    )))}
                </Bloque>
              </div>
            </div>
          </div>

          <div className="dash-row">
            <div className="card">
              <div className="card__header">
                <div className="card__title-wrap">
                  <span className="card__eyebrow">Cobranza</span>
                  <span className="card__title">Facturas impagas recientes</span>
                </div>
                <span className="card__meta">Emitidas y vencidas</span>
              </div>
              <div className="feed">
                <Bloque estado={estado('impagas')} onRetry={reload}>
                  {(facturas) => (facturas.length === 0
                    ? <p className="dash-empty">No hay facturas impagas.</p>
                    : facturas.map((f) => {
                      const meta = KIND_META[f.estado] || KIND_META.EMITIDA
                      return (
                        <div key={f.id} className="feed__item">
                          <div className="feed__mark" style={{ background: meta.bg, color: meta.color, borderColor: 'transparent' }}>
                            {meta.label}
                          </div>
                          <div className="feed__text">
                            {f.numero ?? 'Sin número'} · {f.cliente.nombre} · {formatCurrency(f.total)}
                            <div style={{ marginTop: 4 }}><StatusChip status={ESTADO_FACTURA[f.estado]} /></div>
                          </div>
                          <div className="feed__time">Vence {formatDate(f.fechaVencimiento)}</div>
                        </div>
                      )
                    }))}
                </Bloque>
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
                {atajos.map((a) => (
                  <button
                    key={a.path}
                    type="button"
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
