import { api } from './client.js'

/** Listado paginado. Filtros: periodo 'YYYY-MM', estado, clienteId, grupoId. page base 0, size máx. 100. */
export const listarFacturas = ({ periodo, estado, clienteId, grupoId, page = 0, size = 20 } = {}, opts) =>
  api.get('/api/facturas', { periodo, estado, clienteId, grupoId, page, size }, opts)

export const obtenerFactura = (id) => api.get(`/api/facturas/${id}`)

/** Genera facturas BORRADOR del periodo. Devuelve { periodo, creadas, omitidasExistentes, omitidasSinServicios }. */
export const generarLote = ({ periodo, grupoId, diasVencimiento }) =>
  api.post('/api/facturas/lote', { periodo, grupoId, diasVencimiento })

/** Emite todos los BORRADOR del periodo. Devuelve { periodo, emitidas, primerNumero, ultimoNumero }. */
export const emitirLote = ({ periodo, grupoId }) => api.post('/api/facturas/emitir-lote', { periodo, grupoId })

/** Pasa a VENCIDA las EMITIDAS con plazo cumplido. Devuelve { marcadas, fechaCorte }. */
export const marcarVencidas = () => api.post('/api/facturas/marcar-vencidas')

export const emitirFactura = (id) => api.post(`/api/facturas/${id}/emitir`)

export const pagarFactura = (id) => api.post(`/api/facturas/${id}/pagar`)

export const eliminarFactura = (id) => api.delete(`/api/facturas/${id}`)

/** Facturas de un cliente (paginadas, más recientes primero). */
export const facturasDeCliente = (clienteId, { page = 0, size = 100 } = {}) =>
  api.get(`/api/clientes/${clienteId}/facturas`, { page, size })

/** Cartera vencida agrupada por cliente; grupoId opcional. */
export const carteraVencida = ({ grupoId } = {}) => api.get('/api/facturas/cartera-vencida', { grupoId })

/** Grupos de clientes para poblar filtros. */
export const listarGrupos = () => api.get('/api/grupos', { size: 100 })
