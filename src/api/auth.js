import { api } from './client.js'

export const login = (email, password) => api.post('/api/auth/login', { email, password }, { auth: false })
export const me = () => api.get('/api/auth/me')
export const listarEmpresas = () => api.get('/api/empresas', { size: 100, activa: true })
