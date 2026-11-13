import { api } from './client.js'

export const listarGrupos = ({ activo, page = 0, size = 20 } = {}) =>
  api.get('/api/grupos', { activo, page, size })

export const obtenerGrupo = (id) => api.get(`/api/grupos/${id}`)

export const crearGrupo = (grupo) => api.post('/api/grupos', grupo)

export const actualizarGrupo = (id, grupo) => api.put(`/api/grupos/${id}`, grupo)

export const desactivarGrupo = (id) => api.delete(`/api/grupos/${id}`)
