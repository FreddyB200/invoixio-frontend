import { mensajeError } from '../../utils/format.js'

/** Texto de toast para un error de una acción sobre facturas (404 y 422 con mensaje propio). */
export function mensajeAccion(err) {
  if (err?.status === 404) return 'La factura o el grupo ya no existe en esta empresa. Actualizamos el listado.'
  if (err?.status === 422) return `No se pudo completar la acción: ${mensajeError(err)}`
  return mensajeError(err) || 'No se pudo completar la acción.'
}

export const plural = (n, singular, pluralTxt) => (n === 1 ? singular : pluralTxt)
