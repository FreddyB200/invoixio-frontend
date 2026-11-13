import { listarFacturas } from '../../api/facturas.js'

export const ESTADOS = ['BORRADOR', 'EMITIDA', 'VENCIDA', 'PAGADA']
export const MAX_PAGINAS_RESUMEN = 10
const TAMANO = 100

/**
 * Cantidad y total por estado de las facturas de un periodo (y grupo opcional).
 * Recorre las páginas de la API hasta MAX_PAGINAS_RESUMEN (1.000 facturas); si hay más, `parcial` es true.
 */
export async function resumirPeriodo({ periodo, grupoId }) {
  const resumen = Object.fromEntries(ESTADOS.map((e) => [e, { cantidad: 0, total: 0 }]))
  let pagina = 0
  let totalPaginas = 1
  while (pagina < totalPaginas && pagina < MAX_PAGINAS_RESUMEN) {
    const res = await listarFacturas({ periodo, grupoId, page: pagina, size: TAMANO })
    for (const f of res.content) {
      const r = resumen[f.estado]
      if (r) { r.cantidad += 1; r.total += Number(f.total ?? 0) }
    }
    totalPaginas = res.totalPages
    pagina += 1
  }
  return { porEstado: resumen, parcial: totalPaginas > MAX_PAGINAS_RESUMEN }
}
