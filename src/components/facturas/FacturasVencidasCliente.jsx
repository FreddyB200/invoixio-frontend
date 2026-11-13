import { LoadingState, ErrorState } from '../StateViews.jsx'
import { StatusChip } from '../SharedComponents.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { facturasDeCliente } from '../../api/facturas.js'
import { ESTADO_FACTURA, formatCurrency, formatDate, formatPeriodo } from '../../utils/format.js'

const MAX_PAGINAS = 5

/** Una factura cuenta como cartera si está VENCIDA o EMITIDA con vencimiento anterior al corte. */
export function esVencida(f, fechaCorte) {
  if (f.estado === 'VENCIDA') return true
  return f.estado === 'EMITIDA' && !!f.fechaVencimiento && !!fechaCorte && f.fechaVencimiento < fechaCorte
}

export function diasDeMora(fechaVencimiento, fechaCorte) {
  if (!fechaVencimiento || !fechaCorte) return 0
  const dia = (s) => Date.parse(`${String(s).slice(0, 10)}T00:00:00Z`)
  return Math.max(0, Math.round((dia(fechaCorte) - dia(fechaVencimiento)) / 86400000))
}

async function cargarVencidas(clienteId, fechaCorte) {
  const vencidas = []
  let pagina = 0
  let totalPaginas = 1
  while (pagina < totalPaginas && pagina < MAX_PAGINAS) {
    const res = await facturasDeCliente(clienteId, { page: pagina, size: 100 })
    vencidas.push(...res.content.filter((f) => esVencida(f, fechaCorte)))
    totalPaginas = res.totalPages
    pagina += 1
  }
  return vencidas
}

/** Facturas impagas vencidas de un cliente, con acción rápida de pago. `version` fuerza la recarga tras un pago. */
export default function FacturasVencidasCliente({ clienteId, nombre, fechaCorte, version, onPagar }) {
  const { data, loading, error, reload } = useAsync(
    () => cargarVencidas(clienteId, fechaCorte),
    [clienteId, fechaCorte, version],
  )

  if (loading && !data) return <LoadingState label="Cargando facturas…" />
  if (error && !data) return <ErrorState error={error} onRetry={reload} />
  if (!data || data.length === 0) return <p className="ca-sub-vacio">Este cliente no tiene facturas vencidas.</p>

  return (
    <table className="ca-sub" aria-label={`Facturas vencidas de ${nombre}`}>
      <thead>
        <tr>
          <th>N° Factura</th>
          <th>Periodo</th>
          <th>Vencimiento</th>
          <th style={{ textAlign: 'right' }}>Días de mora</th>
          <th style={{ textAlign: 'right' }}>Total</th>
          <th>Estado</th>
          <th style={{ textAlign: 'right' }}>Acción</th>
        </tr>
      </thead>
      <tbody>
        {data.map((f) => (
          <tr key={f.id}>
            <td><span className="ca-num">{f.numero || '—'}</span></td>
            <td>{formatPeriodo(f.periodo)}</td>
            <td className="ca-fecha">{formatDate(f.fechaVencimiento)}</td>
            <td className="num-cell">{diasDeMora(f.fechaVencimiento, fechaCorte)}</td>
            <td className="num-cell">{formatCurrency(f.total)}</td>
            <td><StatusChip status={ESTADO_FACTURA[f.estado] || f.estado} /></td>
            <td style={{ textAlign: 'right' }}>
              <button
                type="button" className="btn btn--secondary btn--sm"
                aria-label={`Registrar pago de ${f.numero || 'factura'} de ${nombre}`}
                onClick={() => onPagar(f)}
              >
                Registrar pago
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
