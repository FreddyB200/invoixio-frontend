import { api } from './client.js'

export const ESTADOS = ['BORRADOR', 'EMITIDA', 'PAGADA', 'VENCIDA']

/** Tamaño de página (máximo del backend) y tope de páginas recorridas para sumar los totales del periodo. */
export const TAMANO_PAGINA = 100
export const MAX_PAGINAS_TOTALES = 10
export const TOP_MOROSOS = 5
export const IMPAGAS_RECIENTES = 5

const num = (v) => Number(v ?? 0)

/**
 * Suma los totales de una lista de facturas (FacturaResumenResponse).
 * - facturado: lo emitido en el periodo (EMITIDA + PAGADA + VENCIDA); los BORRADOR aún no se han cobrado.
 * - recaudado: PAGADA.
 * - porCobrar: EMITIDA + VENCIDA.
 */
export function agregarTotales(facturas) {
  const totales = { facturado: 0, recaudado: 0, porCobrar: 0 }
  for (const f of facturas ?? []) {
    const total = num(f.total)
    if (f.estado === 'PAGADA') {
      totales.recaudado += total
      totales.facturado += total
    } else if (f.estado === 'EMITIDA' || f.estado === 'VENCIDA') {
      totales.porCobrar += total
      totales.facturado += total
    }
  }
  return totales
}

export async function contarClientesActivos() {
  const page = await api.get('/api/clientes', { activo: true, size: 1 })
  return page.totalElements
}

/** Facturas del periodo por estado, usando solo totalElements de páginas de tamaño 1. */
export async function contarFacturasPorEstado(periodo) {
  const paginas = await Promise.all(
    ESTADOS.map((estado) => api.get('/api/facturas', { periodo, estado, size: 1 })),
  )
  const porEstado = {}
  ESTADOS.forEach((estado, i) => { porEstado[estado] = paginas[i].totalElements })
  return { ...porEstado, total: ESTADOS.reduce((s, e) => s + porEstado[e], 0) }
}

/**
 * Totales en dinero del periodo. Recorre hasta MAX_PAGINAS_TOTALES páginas de TAMANO_PAGINA facturas
 * (1.000 facturas); si el periodo tiene más, `truncado` es true y las cifras son un mínimo.
 */
export async function totalesPeriodo(periodo) {
  const pedir = (page) => api.get('/api/facturas', { periodo, page, size: TAMANO_PAGINA })
  const primera = await pedir(0)
  const paginas = Math.min(primera.totalPages ?? 1, MAX_PAGINAS_TOTALES)
  const restantes = await Promise.all(
    Array.from({ length: Math.max(paginas - 1, 0) }, (_, i) => pedir(i + 1)),
  )
  const facturas = [primera, ...restantes].flatMap((p) => p.content ?? [])
  return {
    ...agregarTotales(facturas),
    facturasContadas: facturas.length,
    truncado: (primera.totalPages ?? 1) > MAX_PAGINAS_TOTALES,
  }
}

/** Cartera vencida: totales y los mayores morosos por monto adeudado. */
export async function carteraResumen() {
  const c = await api.get('/api/facturas/cartera-vencida')
  const top = [...(c.clientes ?? [])]
    .sort((a, b) => num(b.totalAdeudado) - num(a.totalAdeudado))
    .slice(0, TOP_MOROSOS)
  return {
    fechaCorte: c.fechaCorte,
    totalAdeudado: num(c.totalAdeudado),
    totalClientes: c.totalClientes ?? 0,
    totalFacturasVencidas: c.totalFacturasVencidas ?? 0,
    top,
  }
}

/** Últimas facturas EMITIDA o VENCIDA (las más recientes primero). */
export async function facturasImpagasRecientes() {
  const pedir = (estado) => api.get('/api/facturas', { estado, size: IMPAGAS_RECIENTES, sort: 'id,desc' })
  const paginas = await Promise.all([pedir('EMITIDA'), pedir('VENCIDA')])
  return paginas
    .flatMap((p) => p.content ?? [])
    .sort((a, b) => b.id - a.id)
    .slice(0, IMPAGAS_RECIENTES)
}

async function bloque(fn) {
  try {
    return { data: await fn() }
  } catch (error) {
    return { error }
  }
}

/**
 * Carga todos los bloques del resumen en paralelo. Cada bloque es { data } o { error }:
 * un fallo parcial no tumba a los demás.
 */
export async function cargarResumen(periodo) {
  const [clientes, conteos, totales, cartera, impagas] = await Promise.all([
    bloque(contarClientesActivos),
    bloque(() => contarFacturasPorEstado(periodo)),
    bloque(() => totalesPeriodo(periodo)),
    bloque(carteraResumen),
    bloque(facturasImpagasRecientes),
  ])
  return { clientes, conteos, totales, cartera, impagas }
}
