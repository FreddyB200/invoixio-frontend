import { api } from './client.js'

export const TIPOS_DOCUMENTO = ['CC', 'CE', 'NIT', 'PASAPORTE']

export const listarEmpleados = ({ grupoId, activo, page = 0, size = 20 } = {}) =>
  api.get('/api/empleados', { grupoId, activo, page, size })

export const crearEmpleado = (empleado) => api.post('/api/empleados', empleado)

export const actualizarEmpleado = (id, empleado) => api.put(`/api/empleados/${id}`, empleado)

export const desactivarEmpleado = (id) => api.delete(`/api/empleados/${id}`)

/** Grupos de la empresa (máximo 100) para el select de grupo. */
export const listarGrupos = () => api.get('/api/grupos', { size: 100 })
