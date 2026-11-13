/**
 * FacturasPage — facturación por periodo: generación en lote, emisión, pago y consulta.
 */

import { useCallback, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import Icon from '../components/Icon.jsx'
import { KPICard, StatusChip, Toast } from '../components/SharedComponents.jsx'
import { EmptyState, ErrorState, LoadingState, Pagination } from '../components/StateViews.jsx'
import ConfirmModal from '../components/facturas/ConfirmModal.jsx'
import FacturaDetalleModal from '../components/facturas/FacturaDetalleModal.jsx'
import GenerarLoteModal from '../components/facturas/GenerarLoteModal.jsx'
import { ESTADOS, MAX_PAGINAS_RESUMEN, resumirPeriodo } from '../components/facturas/resumen.js'
import { mensajeAccion, plural } from '../components/facturas/mensajes.js'
import { useAsync } from '../hooks/useAsync.js'
import {
  eliminarFactura, emitirFactura, emitirLote, listarFacturas, listarGrupos, marcarVencidas, pagarFactura,
} from '../api/facturas.js'
import {
  ESTADO_FACTURA, formatCurrency, formatDate, formatPeriodo, periodoActual, sumarMeses,
} from '../utils/format.js'

const TAMANO_PAGINA = 20

const css = `
.fa-periodo { display:flex; align-items:center; gap:8px; }
.fa-periodo__label { min-width:150px; text-align:center; font-family:var(--font-serif); font-size:17px; text-transform:capitalize; color:var(--ink); }
.fa-select { width:auto; padding:8px 14px; }
.fa-num { font-family:var(--font-mono); font-size:12.5px; font-weight:500; letter-spacing:.04em; color:var(--ink); }
.fa-num--borrador { color:var(--ink-4); font-style:italic; font-family:var(--font-sans); letter-spacing:0; }
.fa-sub { display:block; font-size:11.5px; color:var(--ink-4); }
.fa-fecha { font-family:var(--font-mono); font-size:12px; color:var(--ink-3); }
.fa-acciones { display:flex; gap:6px; justify-content:flex-end; flex-wrap:wrap; }
.fa-nota { font-size:12px; color:var(--ink-4); margin:-16px 0 20px; }
.fa-reload { opacity:.6; transition:opacity .15s; }
.fa-head-actions { display:flex; gap:10px; flex-wrap:wrap; }
`

function FacturasPage() {
  const [periodo, setPeriodo] = useState(() => periodoActual())
  const [estado, setEstado] = useState('')
  const [grupoId, setGrupoId] = useState('')
  const [page, setPage] = useState(0)
  const [version, setVersion] = useState(0)
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const cerrarToast = useCallback(() => setToast(null), [])

  const grupos = useAsync(listarGrupos, [])
  const lista = useAsync(
    () => listarFacturas({ periodo, estado, grupoId, page, size: TAMANO_PAGINA }),
    [periodo, estado, grupoId, page, version],
  )
  const resumen = useAsync(() => resumirPeriodo({ periodo, grupoId }), [periodo, grupoId, version])

  const listaGrupos = grupos.data?.content ?? []
  const nombreGrupo = listaGrupos.find((g) => String(g.id) === String(grupoId))?.nombre
  const refrescar = () => setVersion((v) => v + 1)
  const cerrarModal = () => setModal(null)

  const cambiarPeriodo = (nuevo) => { setPeriodo(nuevo); setPage(0) }
  const cambiarEstado = (v) => { setEstado(v); setPage(0) }
  const cambiarGrupo = (v) => { setGrupoId(v); setPage(0) }

  const fallo = (err) => {
    setToast({ message: mensajeAccion(err), type: 'error' })
    if (err?.status === 404 || err?.status === 422) refrescar()
  }

  /** Ejecuta una acción de escritura: toast de éxito o de error, cierra el modal de confirmación y recarga. */
  const ejecutar = async (accion, mensajeOk) => {
    setBusy(true)
    try {
      const res = await accion()
      setToast({ message: mensajeOk(res), type: 'success' })
      cerrarModal()
      refrescar()
    } catch (err) {
      cerrarModal()
      fallo(err)
    } finally {
      setBusy(false)
    }
  }

  const emitirUna = (f) => ejecutar(
    () => emitirFactura(f.id),
    (r) => `Factura ${r.numero} emitida.`,
  )
  const emitirBorradores = () => ejecutar(
    () => emitirLote({ periodo, grupoId: grupoId ? Number(grupoId) : undefined }),
    (r) => (r.emitidas === 0
      ? 'No había borradores por emitir en este periodo.'
      : `${r.emitidas} ${plural(r.emitidas, 'factura emitida', 'facturas emitidas')} (${r.primerNumero} a ${r.ultimoNumero}).`),
  )
  const pagar = (f) => ejecutar(
    () => pagarFactura(f.id),
    () => `Pago registrado para ${f.numero || 'la factura'}.`,
  )
  const eliminar = (f) => ejecutar(
    () => eliminarFactura(f.id),
    () => 'Borrador eliminado.',
  )
  const vencidas = () => ejecutar(
    () => marcarVencidas(),
    (r) => (r.marcadas === 0
      ? 'No hay facturas emitidas con el plazo cumplido.'
      : `${r.marcadas} ${plural(r.marcadas, 'factura marcada', 'facturas marcadas')} como vencidas.`),
  )

  const filas = lista.data?.content ?? []
  const etiquetaFila = (f) => f.numero || `borrador de ${f.cliente?.nombre}`
  const kpis = [
    { estado: 'BORRADOR', label: 'Borradores', accent: 'ink', num: 'N° 01' },
    { estado: 'EMITIDA', label: 'Emitidas', accent: 'amber', num: 'N° 02' },
    { estado: 'VENCIDA', label: 'Vencidas', accent: 'oxblood', num: 'N° 03' },
    { estado: 'PAGADA', label: 'Pagadas', accent: 'moss', num: 'N° 04' },
  ]
  const porEstado = resumen.data?.porEstado

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Facturación" eyebrow="Módulo II · Operaciones" />
        <style>{css}</style>

        <main className="page-content">
          <div className="page-header">
            <div className="page-header__left">
              <span className="page-header__eyebrow">Módulo II <span>·</span> Facturación por periodo</span>
              <h1>Gestión de <em>facturas</em></h1>
              <p>Genera las cuotas del mes a partir de las tarifas, emítelas en lote y registra los pagos.</p>
            </div>
            <div className="fa-head-actions">
              <button type="button" className="btn btn--ghost" onClick={vencidas} disabled={busy}>
                <Icon name="warning" size={13} />
                Marcar vencidas
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => setModal({ tipo: 'emitirLote' })}>
                <Icon name="check" size={13} />
                Emitir borradores
              </button>
              <button type="button" className="btn btn--primary" onClick={() => setModal({ tipo: 'generar' })}>
                <Icon name="plus" size={13} />
                Generar facturas del periodo
              </button>
            </div>
          </div>

          <div className="toolbar">
            <div className="fa-periodo" role="group" aria-label="Periodo">
              <button
                type="button" className="btn btn--ghost btn--sm" aria-label="Periodo anterior"
                onClick={() => cambiarPeriodo(sumarMeses(periodo, -1))}
              >‹</button>
              <span className="fa-periodo__label" aria-live="polite">{formatPeriodo(periodo)}</span>
              <button
                type="button" className="btn btn--ghost btn--sm" aria-label="Periodo siguiente"
                onClick={() => cambiarPeriodo(sumarMeses(periodo, 1))}
              >›</button>
              {periodo !== periodoActual() && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => cambiarPeriodo(periodoActual())}>
                  Periodo actual
                </button>
              )}
            </div>
            <select
              className="form-select fa-select" aria-label="Filtrar por estado" value={estado}
              onChange={(e) => cambiarEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_FACTURA[e]}</option>)}
            </select>
            <select
              className="form-select fa-select" aria-label="Filtrar por grupo" value={grupoId}
              onChange={(e) => cambiarGrupo(e.target.value)}
            >
              <option value="">Todos los grupos</option>
              {listaGrupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
            <span className="toolbar__count">
              <strong>{lista.data ? lista.data.totalElements : '—'}</strong> {plural(lista.data?.totalElements, 'factura', 'facturas')}
            </span>
          </div>

          <div className="kpi-grid" aria-label={`Resumen de ${formatPeriodo(periodo)}`}>
            {kpis.map((k) => {
              const r = porEstado?.[k.estado]
              return (
                <KPICard
                  key={k.estado}
                  label={k.label}
                  num={k.num}
                  accent={k.accent}
                  value={r ? formatCurrency(r.total) : resumen.error ? '—' : '…'}
                  trend={{ dir: 'flat', text: r ? `${r.cantidad} ${plural(r.cantidad, 'factura', 'facturas')}` : ' ' }}
                />
              )
            })}
          </div>
          {resumen.data?.parcial && (
            <p className="fa-nota">
              Resumen parcial: se sumaron las primeras {MAX_PAGINAS_RESUMEN * 100} facturas del periodo.
            </p>
          )}

          <div className="card">
            <div className="card__header">
              <div className="card__title-wrap">
                <span className="card__eyebrow">Libro auxiliar</span>
                <span className="card__title">Facturas de <em>{formatPeriodo(periodo)}</em></span>
              </div>
              <span className="card__meta">{nombreGrupo || 'Todos los grupos'}</span>
            </div>
            <div className="card__body" style={{ padding: 0 }}>
              {lista.loading && !lista.data && <LoadingState label="Cargando facturas…" />}
              {lista.error && !lista.data && <ErrorState error={lista.error} onRetry={lista.reload} />}
              {lista.data && filas.length === 0 && (
                <EmptyState
                  title="No hay facturas para estos filtros"
                  hint="Usa «Generar facturas del periodo» para crear los borradores a partir de las tarifas."
                />
              )}
              {lista.data && filas.length > 0 && (
                <div className={lista.loading ? 'fa-reload' : undefined} style={{ overflowX: 'auto' }}>
                  <table aria-label="Facturas del periodo">
                    <thead>
                      <tr>
                        <th>N° Factura</th>
                        <th>Cliente</th>
                        <th>Grupo</th>
                        <th>Periodo</th>
                        <th>Vencimiento</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                        <th>Estado</th>
                        <th style={{ textAlign: 'right' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((f) => (
                        <tr key={f.id}>
                          <td>
                            {f.numero
                              ? <span className="fa-num">{f.numero}</span>
                              : <span className="fa-num fa-num--borrador">Borrador</span>}
                          </td>
                          <td>
                            {f.cliente?.nombre}
                            {f.cliente?.unidad && <span className="fa-sub">{f.cliente.unidad}</span>}
                          </td>
                          <td>{f.cliente?.grupoNombre || '—'}</td>
                          <td className="fa-fecha">{formatPeriodo(f.periodo)}</td>
                          <td className="fa-fecha">{formatDate(f.fechaVencimiento)}</td>
                          <td className="num-cell">{formatCurrency(f.total)}</td>
                          <td><StatusChip status={ESTADO_FACTURA[f.estado] || f.estado} /></td>
                          <td>
                            <div className="fa-acciones">
                              <button
                                type="button" className="btn btn--ghost btn--sm"
                                aria-label={`Ver detalle de ${etiquetaFila(f)}`}
                                onClick={() => setModal({ tipo: 'detalle', factura: f })}
                              >
                                <Icon name="eye" size={11} /> Ver
                              </button>
                              {f.estado === 'BORRADOR' && (
                                <button
                                  type="button" className="btn btn--secondary btn--sm" disabled={busy}
                                  aria-label={`Emitir ${etiquetaFila(f)}`}
                                  onClick={() => emitirUna(f)}
                                >
                                  Emitir
                                </button>
                              )}
                              {(f.estado === 'EMITIDA' || f.estado === 'VENCIDA') && (
                                <button
                                  type="button" className="btn btn--secondary btn--sm"
                                  aria-label={`Registrar pago de ${etiquetaFila(f)}`}
                                  onClick={() => setModal({ tipo: 'pagar', factura: f })}
                                >
                                  Registrar pago
                                </button>
                              )}
                              {f.estado === 'BORRADOR' && (
                                <button
                                  type="button" className="btn btn--danger btn--sm"
                                  aria-label={`Eliminar ${etiquetaFila(f)}`}
                                  onClick={() => setModal({ tipo: 'eliminar', factura: f })}
                                >
                                  <Icon name="trash" size={11} /> Eliminar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          {lista.data && (
            <Pagination
              page={lista.data.page}
              totalPages={lista.data.totalPages}
              totalElements={lista.data.totalElements}
              onPage={setPage}
            />
          )}
        </main>
      </div>

      {modal?.tipo === 'generar' && (
        <GenerarLoteModal
          periodoInicial={periodo}
          grupoInicial={grupoId}
          grupos={listaGrupos}
          onHecho={refrescar}
          onError={fallo}
          onClose={cerrarModal}
        />
      )}
      {modal?.tipo === 'detalle' && (
        <FacturaDetalleModal facturaId={modal.factura.id} onClose={cerrarModal} />
      )}
      {modal?.tipo === 'emitirLote' && (
        <ConfirmModal
          eyebrow="Emisión en lote" title="Emitir borradores" confirmLabel="Emitir borradores"
          busy={busy} onConfirm={emitirBorradores} onClose={cerrarModal}
        >
          Se emitirán todos los borradores de {formatPeriodo(periodo)}
          {nombreGrupo ? ` del grupo ${nombreGrupo}` : ''} y recibirán su número consecutivo.
          Esta acción no se puede deshacer.
        </ConfirmModal>
      )}
      {modal?.tipo === 'pagar' && (
        <ConfirmModal
          eyebrow="Registro de pago" title="Registrar pago" confirmLabel="Confirmar pago"
          busy={busy} onConfirm={() => pagar(modal.factura)} onClose={cerrarModal}
        >
          ¿Confirmas el pago de {modal.factura.numero || 'esta factura'} de {modal.factura.cliente?.nombre} por{' '}
          <strong>{formatCurrency(modal.factura.total)}</strong>? La factura pasará a Pagada con la fecha de hoy.
        </ConfirmModal>
      )}
      {modal?.tipo === 'eliminar' && (
        <ConfirmModal
          eyebrow="Eliminar borrador" title="Eliminar borrador" confirmLabel="Eliminar" tono="danger"
          busy={busy} onConfirm={() => eliminar(modal.factura)} onClose={cerrarModal}
        >
          ¿Eliminar el borrador de {modal.factura.cliente?.nombre} de {formatPeriodo(modal.factura.periodo)}?
          Podrás volver a generarlo con «Generar facturas del periodo».
        </ConfirmModal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={cerrarToast} />}
    </div>
  )
}

export default FacturasPage
