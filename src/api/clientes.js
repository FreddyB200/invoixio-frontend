import { api } from './client.js'

export const listarClientes = ({ q, grupoId, activo, page = 0, size = 20 } = {}) =>
  api.get('/api/clientes', { q, grupoId, activo, page, size })

export const obtenerCliente = (id) => api.get(`/api/clientes/${id}`)

export const crearCliente = (cliente) => api.post('/api/clientes', cliente)

export const actualizarCliente = (id, cliente) => api.put(`/api/clientes/${id}`, cliente)

export const desactivarCliente = (id) => api.delete(`/api/clientes/${id}`)
