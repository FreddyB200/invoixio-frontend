/**
 * CarteraPage — cartera vencida agrupada por cliente, con detalle de facturas y pago rápido.
 */

import { Fragment, useCallback, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import { KPICard, Toast } from '../components/SharedComponents.jsx'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews.jsx'
import ConfirmModal from '../components/facturas/ConfirmModal.jsx'
import FacturasVencidasCliente from '../components/facturas/FacturasVencidasCliente.jsx'
import { mensajeAccion, plural } from '../components/facturas/mensajes.js'
import { useAsync } from '../hooks/useAsync.js'
import { carteraVencida, listarGrupos, pagarFactura } from '../api/facturas.js'
import { formatCurrency, formatDate } from '../utils/format.js'

const css = `
.ca-fecha { font-family:var(--font-mono); font-size:12px; color:var(--ink-3); }
.ca-select { width:auto; padding:8px 14px; }
.ca-sub-cell { background:var(--surface-2); padding:6px 18px 18px 56px !important; }
.ca-sub { width:100%; border-collapse:collapse; font-size:13px; }
.ca-sub th { padding:8px; font-size:9.5px; }
.ca-sub td { padding:9px 8px; }
.ca-sub-vacio { font-size:13px; color:var(--ink-3); padding:12px 0; }
.ca-num { font-family:var(--font-mono); font-size:12.5px; color:var(--ink); }
.ca-toggle { background:none; border:none; cursor:pointer; color:var(--ink-3); font-size:14px; width:28px; height:28px; border-radius:2px; }
.ca-toggle:hover { background:var(--paper-2); color:var(--ink); }
.ca-toggle:focus-visible { outline:2px solid var(--ink); }
.ca-mora { display:inline-block; font-family:var(--font-mono); font-size:12px; font-weight:600; padding:3px 9px; border-radius:2px; border:1px solid; }
.ca-mora--leve { background:var(--amber-wash); color:var(--amber); border-color:#dcc69a; }
.ca-mora--media { background:var(--oxblood-wash); color:var(--oxblood); border-color:#e3c3bc; }
.ca-mora--grave { background:var(--oxblood); color:var(--paper); border-color:var(--oxblood-2); }
`

/** Gravedad de la mora: hasta 30 días leve, hasta 90 media, más de 90 grave. */
function gravedadMora(dias) {
  if (dias > 90) return { clase: 'grave', texto: 'Mora grave' }
  if (dias > 30) return { clase: 'media', texto: 'Mora media' }
  return { clase: 'leve', texto: 'Mora leve' }
}

export default function CarteraPage() {
  const [grupoId, setGrupoId] = useState('')
  const [abiertos, setAbiertos] = useState(() => new Set())
  const [version, setVersion] = useState(0)
  const [pago, setPago] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const cerrarToast = useCallback(() => setToast(null), [])

  const grupos = useAsync(listarGrupos, [])
  const cartera = useAsync(() => carteraVencida({ grupoId }), [grupoId, version])
  const listaGrupos = grupos.data?.content ?? []
  const c = cartera.data

  const alternar = (id) => setAbiertos((prev) => {
    const n = new Set(prev)
    if (n.has(id)) n.delete(id); else n.add(id)
    return n
  })

  const confirmarPago = async () => {
    setBusy(true)
    try {
      await pagarFactura(pago.factura.id)
      setToast({ message: `Pago registrado para ${pago.factura.numero || 'la factura'}.`, type: 'success' })
      setPago(null)
      setVersion((v) => v + 1)
    } catch (err) {
      setToast({ message: mensajeAccion(err), type: 'error' })
      setPago(null)
      if (err?.status === 404 || err?.status === 422) setVersion((v) => v + 1)
    } finally {
      setBusy(false)
    }
  }

  const sinCartera = c && c.clientes.length === 0

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Cartera vencida" eyebrow="Módulo III · Cobranza" />
        <style>{css}</style>

        <main className="page-content">
          <div className="page-header">
            <div className="page-header__left">
              <span className="page-header__eyebrow">Módulo III <span>·</span> Cobranza</span>
              <h1>Cartera <em>vencida</em></h1>
              <p>Clientes con facturas impagas fuera de plazo, de mayor a menor atraso, para priorizar el cobro.</p>
            </div>
          </div>

          <div className="toolbar">
            <select
              className="form-select ca-select" aria-label="Filtrar por grupo" value={grupoId}
              onChange={(e) => { setGrupoId(e.target.value); setAbiertos(new Set()) }}
            >
              <option value="">Todos los grupos</option>
              {listaGrupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
            <span className="toolbar__count">
              <strong>{c ? c.totalClientes : '—'}</strong> {plural(c?.totalClientes, 'cliente', 'clientes')} en mora
            </span>
          </div>

          <div className="kpi-grid" aria-label="Totales de cartera">
            <KPICard label="Clientes en mora" num="N° 01" accent="oxblood" value={c ? c.totalClientes : '…'} />
            <KPICard label="Facturas vencidas" num="N° 02" accent="amber" value={c ? c.totalFacturasVencidas : '…'} />
            <KPICard label="Total adeudado" num="N° 03" accent="oxblood" value={c ? formatCurrency(c.totalAdeudado) : '…'} />
            <KPICard label="Fecha de corte" num="N° 04" accent="ink" value={c ? formatDate(c.fechaCorte) : '…'} />
          </div>

          <div className="card">
            <div className="card__header">
              <div className="card__title-wrap">
                <span className="card__eyebrow">Cuentas por cobrar</span>
                <span className="card__title">Deuda por <em>cliente</em></span>
              </div>
            </div>
            <div className="card__body" style={{ padding: 0 }}>
              {cartera.loading && !c && <LoadingState label="Cargando cartera…" />}
              {cartera.error && !c && <ErrorState error={cartera.error} onRetry={cartera.reload} />}
              {sinCartera && (
                <EmptyState
                  title="Sin cartera vencida"
                  hint={grupoId
                    ? 'Ningún cliente de este grupo tiene facturas vencidas.'
                    : 'Todos los clientes están al día. Cuando una factura pase su fecha de vencimiento aparecerá aquí.'}
                />
              )}
              {c && c.clientes.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table aria-label="Cartera vencida por cliente">
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}><span className="sr-only">Detalle</span></th>
                        <th>Cliente</th>
                        <th>Unidad</th>
                        <th>Grupo</th>
                        <th style={{ textAlign: 'right' }}>Facturas vencidas</th>
                        <th style={{ textAlign: 'right' }}>Total adeudado</th>
                        <th style={{ textAlign: 'right' }}>Mora máxima</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.clientes.map((fila) => {
                        const cl = fila.cliente
                        const abierto = abiertos.has(cl.id)
                        const g = gravedadMora(fila.diasMoraMaximo)
                        return (
                          <Fragment key={cl.id}>
                            <tr>
                              <td>
                                <button
                                  type="button" className="ca-toggle" aria-expanded={abierto}
                                  aria-label={`${abierto ? 'Ocultar' : 'Ver'} facturas vencidas de ${cl.nombre}`}
                                  onClick={() => alternar(cl.id)}
                                >
                                  {abierto ? '▾' : '▸'}
                                </button>
                              </td>
                              <td>{cl.nombre}</td>
                              <td>{cl.unidad || '—'}</td>
                              <td>{cl.grupoNombre || '—'}</td>
                              <td className="num-cell">{fila.facturasVencidas}</td>
                              <td className="num-cell">{formatCurrency(fila.totalAdeudado)}</td>
                              <td style={{ textAlign: 'right' }}>
                                <span className={`ca-mora ca-mora--${g.clase}`} title={g.texto}>
                                  {fila.diasMoraMaximo} {plural(fila.diasMoraMaximo, 'día', 'días')}
                                  <span className="sr-only"> · {g.texto}</span>
                                </span>
                              </td>
                            </tr>
                            {abierto && (
                              <tr>
                                <td colSpan={7} className="ca-sub-cell">
                                  <FacturasVencidasCliente
                                    clienteId={cl.id}
                                    nombre={cl.nombre}
                                    fechaCorte={c.fechaCorte}
                                    version={version}
                                    onPagar={(factura) => setPago({ factura, cliente: cl })}
                                  />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {pago && (
        <ConfirmModal
          eyebrow="Registro de pago" title="Registrar pago" confirmLabel="Confirmar pago"
          busy={busy} onConfirm={confirmarPago} onClose={() => setPago(null)}
        >
          ¿Confirmas el pago de {pago.factura.numero || 'esta factura'} de {pago.cliente.nombre} por{' '}
          <strong>{formatCurrency(pago.factura.total)}</strong>? La factura pasará a Pagada con la fecha de hoy.
        </ConfirmModal>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={cerrarToast} />}
    </div>
  )
}
