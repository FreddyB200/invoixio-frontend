const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

/** Pesos colombianos sin decimales: 1234567 -> "$ 1.234.567". Acepta number o string numerico del backend. */
export const formatCurrency = (value) => '$ ' + Math.round(Number(value ?? 0)).toLocaleString('es-CO')

/** 'YYYY-MM-DD' -> 'DD/MM/YYYY' sin desfase de zona horaria. */
export function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = String(iso).slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

/** 'YYYY-MM' -> 'noviembre 2026' */
export function formatPeriodo(periodo) {
  if (!periodo) return '—'
  const [y, m] = periodo.split('-')
  return `${MESES[Number(m) - 1]} ${y}`
}

/** Periodo actual 'YYYY-MM' (hora local). */
export function periodoActual(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}

/** Suma n meses (puede ser negativo) a un periodo 'YYYY-MM'. */
export function sumarMeses(periodo, n) {
  const [y, m] = periodo.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return periodoActual(d)
}

/** Estados de factura del backend -> etiqueta para StatusChip. */
export const ESTADO_FACTURA = {
  BORRADOR: 'Borrador',
  EMITIDA: 'Emitida',
  PAGADA: 'Pagada',
  VENCIDA: 'Vencida',
}

export const TIPOS_GRUPO = { CONJUNTO: 'Conjunto', SEDE: 'Sede', ZONA: 'Zona', PLAN: 'Plan' }

/** Mensaje legible para mostrar al usuario a partir de cualquier error. */
export function mensajeError(err) {
  if (!err) return ''
  const campos = err.errores && Object.values(err.errores)
  return campos?.length ? campos.join(' · ') : err.message
}
