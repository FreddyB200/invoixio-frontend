import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDate, formatPeriodo, periodoActual, sumarMeses, mensajeError } from './format.js'

describe('formato', () => {
  it('moneda colombiana sin decimales, desde number o string', () => {
    expect(formatCurrency(1234567)).toMatch(/^\$ 1[.,\s]234[.,\s]567$/)
    expect(formatCurrency('340000.00')).toMatch(/340/)
  })
  it('fecha ISO sin desfase de zona horaria', () => {
    expect(formatDate('2026-11-15')).toBe('15/11/2026')
    expect(formatDate(null)).toBe('—')
  })
  it('periodos', () => {
    expect(formatPeriodo('2026-11')).toBe('noviembre 2026')
    expect(periodoActual(new Date(2026, 0, 5))).toBe('2026-01')
    expect(sumarMeses('2026-01', -1)).toBe('2025-12')
    expect(sumarMeses('2026-11', 3)).toBe('2027-02')
  })
  it('mensaje de error prioriza los errores por campo', () => {
    expect(mensajeError({ message: 'x', errores: { a: 'Uno', b: 'Dos' } })).toBe('Uno · Dos')
    expect(mensajeError({ message: 'Solo mensaje', errores: {} })).toBe('Solo mensaje')
  })
})
