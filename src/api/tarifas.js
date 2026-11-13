import { api } from './client.js'

const BASE = '/api/tarifas'

/** Tarifas base de un grupo, o de toda la empresa si no se indica `grupoId`. */
export const listarTarifas = (grupoId) => api.get(BASE, { grupoId })

export const guardarTarifaGrupo = (grupoId, servicioId, valor) =>
  api.put(`${BASE}/grupos/${grupoId}/servicios/${servicioId}`, { valor })

export const listarOverrides = (clienteId) => api.get(`${BASE}/clientes/${clienteId}`)

export const guardarOverride = (clienteId, servicioId, valor) =>
  api.put(`${BASE}/clientes/${clienteId}/servicios/${servicioId}`, { valor })

export const quitarOverride = (clienteId, servicioId) =>
  api.delete(`${BASE}/clientes/${clienteId}/servicios/${servicioId}`)

/** body: { anio, porcentaje, grupoId? }. Responde 409 si ese anio y ambito ya se ajustaron. */
export const aplicarAjusteIpc = (body) => api.post(`${BASE}/ajuste-ipc`, body)

export const listarAjustes = () => api.get(`${BASE}/ajustes`)

/** Grupos de clientes de la empresa (lectura propia de este modulo). */
export const listarGrupos = ({ activo, page = 0, size = 20 } = {}) => api.get('/api/grupos', { activo, page, size })

export async function listarTodosGrupos({ activo } = {}) {
  const items = []
  let page = 0
  let totalPages = 1
  while (page < totalPages) {
    const res = await listarGrupos({ activo, page, size: 100 })
    items.push(...res.content)
    totalPages = res.totalPages
    page += 1
  }
  return items
}

/** Busqueda de clientes por nombre, documento o unidad. */
export const buscarClientes = ({ q, size = 10 } = {}) => api.get('/api/clientes', { q, size })
