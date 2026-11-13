import { api } from './client.js'

const BASE = '/api/servicios'

/** Pagina de servicios: { content, page, size, totalElements, totalPages }. `activo` es opcional. */
export const listarServicios = ({ activo, page = 0, size = 20 } = {}) => api.get(BASE, { activo, page, size })

/** Recorre todas las paginas (maximo 100 por pagina) y devuelve la lista completa. */
export async function listarTodosServicios({ activo } = {}) {
  const items = []
  let page = 0
  let totalPages = 1
  while (page < totalPages) {
    const res = await listarServicios({ activo, page, size: 100 })
    items.push(...res.content)
    totalPages = res.totalPages
    page += 1
  }
  return items
}

export const crearServicio = (datos) => api.post(BASE, datos)
export const actualizarServicio = (id, datos) => api.put(`${BASE}/${id}`, datos)
export const desactivarServicio = (id) => api.delete(`${BASE}/${id}`)
