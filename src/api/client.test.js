import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api, session, setUnauthorizedHandler } from './client.js'

const respuesta = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => (body === undefined ? '' : JSON.stringify(body)),
})

describe('cliente API', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()) })
  afterEach(() => { vi.unstubAllGlobals(); setUnauthorizedHandler(null) })

  it('adjunta el token y la empresa activa, y omite parametros vacios', async () => {
    session.setToken('abc')
    session.setEmpresaId(7)
    fetch.mockResolvedValue(respuesta(200, { ok: true }))

    await api.get('/api/clientes', { q: 'ana', activo: '', page: 0, grupoId: null })

    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('/api/clientes?q=ana&page=0')
    expect(init.headers.Authorization).toBe('Bearer abc')
    expect(init.headers['X-Empresa-Id']).toBe('7')
  })

  it('no envia credenciales en rutas publicas', async () => {
    session.setToken('abc')
    fetch.mockResolvedValue(respuesta(200, {}))
    await api.post('/api/auth/login', { email: 'a', password: 'b' }, { auth: false })
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it('traduce un problem+json a ApiError con errores por campo', async () => {
    fetch.mockResolvedValue(respuesta(400, { title: 'Datos invalidos', detail: 'Revisa los campos', errores: { nombre: 'Obligatorio' } }))
    await expect(api.post('/api/clientes', {})).rejects.toMatchObject({
      name: 'ApiError', status: 400, errores: { nombre: 'Obligatorio' },
    })
  })

  it('un 401 en ruta protegida limpia la sesion y avisa a la app', async () => {
    const aviso = vi.fn()
    setUnauthorizedHandler(aviso)
    session.setToken('vencido')
    fetch.mockResolvedValue(respuesta(401, { title: 'No autenticado' }))
    await expect(api.get('/api/clientes')).rejects.toBeInstanceOf(ApiError)
    expect(session.getToken()).toBeNull()
    expect(aviso).toHaveBeenCalledOnce()
  })

  it('un 401 del login NO cierra sesion (credenciales erroneas)', async () => {
    const aviso = vi.fn()
    setUnauthorizedHandler(aviso)
    fetch.mockResolvedValue(respuesta(401, { title: 'No autenticado' }))
    await expect(api.post('/api/auth/login', {}, { auth: false })).rejects.toMatchObject({ status: 401 })
    expect(aviso).not.toHaveBeenCalled()
  })

  it('devuelve null en 204 y un error legible si no hay red', async () => {
    fetch.mockResolvedValueOnce(respuesta(204))
    expect(await api.delete('/api/facturas/1')).toBeNull()
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(api.get('/api/clientes')).rejects.toMatchObject({ status: 0 })
  })
})
