import { Modal, StatusChip } from '../SharedComponents.jsx'
import { LoadingState, ErrorState } from '../StateViews.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { obtenerFactura } from '../../api/facturas.js'
import { ESTADO_FACTURA, formatCurrency, formatDate, formatPeriodo } from '../../utils/format.js'

const css = `
.fa-det__meta { display:grid; grid-template-columns:repeat(2,1fr); gap:14px 22px; margin-bottom:20px; }
.fa-det__meta dt { font-family:var(--font-mono); font-size:9.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--ink-4); margin-bottom:3px; }
.fa-det__meta dd { margin:0; font-size:13.5px; color:var(--ink); }
.fa-det__items { width:100%; border-collapse:collapse; font-size:13px; }
.fa-det__items th { text-align:left; padding:8px 8px; font-family:var(--font-mono); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--ink-4); border-bottom:1px solid var(--ink); }
.fa-det__items td { padding:9px 8px; border-bottom:1px dashed var(--rule); }
.fa-det__items .fa-r { text-align:right; font-family:var(--font-mono); font-variant-numeric:tabular-nums; }
.fa-det__total { display:flex; justify-content:space-between; align-items:baseline; margin-top:14px; padding-top:12px; border-top:1px solid var(--ink); }
.fa-det__total span:first-child { font-family:var(--font-mono); font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:var(--ink-3); }
.fa-det__total span:last-child { font-family:var(--font-mono); font-size:22px; font-weight:600; color:var(--ink); }
`

export default function FacturaDetalleModal({ facturaId, onClose }) {
  const { data: f, loading, error, reload } = useAsync(() => obtenerFactura(facturaId), [facturaId])

  return (
    <Modal
      isOpen
      onClose={onClose}
      eyebrow="Detalle de factura"
      title={f ? (f.numero || 'Borrador sin numerar') : 'Factura'}
      footer={<button type="button" className="btn btn--ghost" onClick={onClose}>Cerrar</button>}
    >
      <style>{css}</style>
      {loading && !f && <LoadingState label="Cargando factura…" />}
      {error && !f && <ErrorState error={error} onRetry={reload} />}
      {f && (
        <>
          <dl className="fa-det__meta">
            <div><dt>Cliente</dt><dd>{f.cliente?.nombre}</dd></div>
            <div><dt>Estado</dt><dd><StatusChip status={ESTADO_FACTURA[f.estado] || f.estado} /></dd></div>
            <div><dt>Unidad</dt><dd>{f.cliente?.unidad || '—'}</dd></div>
            <div><dt>Grupo</dt><dd>{f.cliente?.grupoNombre || '—'}</dd></div>
            <div><dt>Periodo</dt><dd>{formatPeriodo(f.periodo)}</dd></div>
            <div><dt>Emisión</dt><dd>{formatDate(f.fechaEmision)}</dd></div>
            <div><dt>Vencimiento</dt><dd>{formatDate(f.fechaVencimiento)}</dd></div>
            <div><dt>Pago</dt><dd>{formatDate(f.fechaPago)}</dd></div>
          </dl>
          <table className="fa-det__items" aria-label="Ítems de la factura">
            <thead>
              <tr>
                <th>Descripción</th>
                <th className="fa-r">Cant.</th>
                <th className="fa-r">Valor</th>
                <th className="fa-r">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {(f.items || []).map((it) => (
                <tr key={it.id}>
                  <td>{it.descripcion}</td>
                  <td className="fa-r">{it.cantidad}</td>
                  <td className="fa-r">{formatCurrency(it.valorUnitario)}</td>
                  <td className="fa-r">{formatCurrency(it.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="fa-det__total">
            <span>Total</span>
            <span>{formatCurrency(f.total)}</span>
          </div>
        </>
      )}
    </Modal>
  )
}
