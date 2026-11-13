import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./client.js', () => ({ api: { get: vi.fn() } }))

import { api } from './client.js'
import {
  agregarTotales, totalesPeriodo, contarFacturasPorEstado, carteraResumen, cargarResumen,
  MAX_PAGINAS_TOTALES,
} from './resumen.js'

const f = (id, estado, total) => ({ id, estado, total })

beforeEach(() => { api.get.mockReset() })

describe('agregarTotales', () => {
  it('separa recaudado, por cobrar y facturado; excluye borradores', () => {
    const t = agregarTotales([
      f(1, 'PAGADA', 100000),
      f(2, 'EMITIDA', 50000.5),
      f(3, 'VENCIDA', 25000),
      f(4, 'BORRADOR', 999999),
    ])
    expect(t).toEqual({ facturado: 175000.5, recaudado: 100000, porCobrar: 75000.5 })
  })

  it('devuelve ceros con lista vacía o nula', () => {
    expect(agregarTotales([])).toEqual({ facturado: 0, recaudado: 0, porCobrar: 0 })
    expect(agregarTotales(null)).toEqual({ facturado: 0, recaudado: 0, porCobrar: 0 })
  })
})

describe('totalesPeriodo', () => {
  it('recorre todas las páginas del periodo', async () => {
    api.get.mockImplementation(async (_ruta, params) => ({
      content: params.page === 0 ? [f(1, 'PAGADA', 10)] : [f(2, 'EMITIDA', 20)],
      totalPages: 2,
    }))
    const t = await totalesPeriodo('2026-11')
    expect(api.get).toHaveBeenCalledWith('/api/facturas', { periodo: '2026-11', page: 0, size: 100 })
    expect(api.get).toHaveBeenCalledWith('/api/facturas', { periodo: '2026-11', page: 1, size: 100 })
    expect(t).toMatchObject({ facturado: 30, recaudado: 10, porCobrar: 20, facturasContadas: 2, truncado: false })
  })

  it('se detiene en el tope de páginas y marca truncado', async () => {
    api.get.mockResolvedValue({ content: [f(1, 'PAGADA', 5)], totalPages: 25 })
    const t = await totalesPeriodo('2026-11')
    expect(api.get).toHaveBeenCalledTimes(MAX_PAGINAS_TOTALES)
    expect(t.truncado).toBe(true)
    expect(t.recaudado).toBe(5 * MAX_PAGINAS_TOTALES)
  })
})

describe('contarFacturasPorEstado', () => {
  it('usa totalElements con size=1 por cada estado', async () => {
    const cuentas = { BORRADOR: 2, EMITIDA: 5, PAGADA: 9, VENCIDA: 1 }
    api.get.mockImplementation(async (_r, p) => ({ content: [], totalElements: cuentas[p.estado] }))
    const r = await contarFacturasPorEstado('2026-11')
    expect(api.get).toHaveBeenCalledWith('/api/facturas', { periodo: '2026-11', estado: 'PAGADA', size: 1 })
    expect(r).toEqual({ ...cuentas, total: 17 })
  })
})

describe('carteraResumen', () => {
  it('ordena los morosos por monto y limita a 5', async () => {
    const clientes = [10, 70, 30, 60, 20, 50, 40].map((m, i) => ({ cliente: { id: i }, totalAdeudado: m }))
    api.get.mockResolvedValue({ fechaCorte: '2026-11-13', totalClientes: 7, totalFacturasVencidas: 9, totalAdeudado: 280, clientes })
    const r = await carteraResumen()
    expect(api.get).toHaveBeenCalledWith('/api/facturas/cartera-vencida')
    expect(r.top.map((c) => c.totalAdeudado)).toEqual([70, 60, 50, 40, 30])
    expect(r).toMatchObject({ totalAdeudado: 280, totalClientes: 7 })
  })
})

describe('cargarResumen', () => {
  it('tolera fallos parciales: el bloque fallido trae error y los demás datos', async () => {
    const falla = new Error('boom')
    api.get.mockImplementation(async (ruta, p) => {
      if (ruta === '/api/clientes') return { totalElements: 12 }
      if (ruta === '/api/facturas/cartera-vencida') throw falla
      if (p.size === 1) return { totalElements: 1, content: [] }
      return { content: [f(1, 'EMITIDA', 10)], totalPages: 1 }
    })
    const r = await cargarResumen('2026-11')
    expect(r.clientes).toEqual({ data: 12 })
    expect(r.cartera).toEqual({ error: falla })
    expect(r.conteos.data.total).toBe(4)
    expect(r.totales.data.porCobrar).toBe(10)
    expect(r.impagas.data).toHaveLength(2)
  })
})
