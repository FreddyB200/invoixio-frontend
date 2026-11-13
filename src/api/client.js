/**
 * Cliente HTTP de Invoixio.
 * - Adjunta el JWT (Authorization) y, para ADMIN_GENERAL, la empresa activa (X-Empresa-Id).
 * - Traduce los errores RFC 7807 del backend a ApiError (status, title, detail, errores por campo).
 * - Ante un 401 en una ruta protegida limpia la sesion y avisa a la app para volver al login.
 */

const BASE = import.meta.env.VITE_API_URL ?? ''
const TOKEN_KEY = 'invoixio.token'
const EMPRESA_KEY = 'invoixio.empresaId'

export class ApiError extends Error {
  constructor(status, problem) {
    super(problem?.detail || problem?.title || 'No se pudo conectar con el servidor')
    this.name = 'ApiError'
    this.status = status
    this.title = problem?.title || null
    this.errores = problem?.errores || {}
  }
}

const storage = {
  get: (k) => { try { return window.localStorage.getItem(k) } catch { return null } },
  set: (k, v) => { try { window.localStorage.setItem(k, v) } catch { /* modo privado */ } },
  del: (k) => { try { window.localStorage.removeItem(k) } catch { /* modo privado */ } },
}

export const session = {
  getToken: () => storage.get(TOKEN_KEY),
  setToken: (t) => storage.set(TOKEN_KEY, t),
  getEmpresaId: () => storage.get(EMPRESA_KEY),
  setEmpresaId: (id) => (id == null ? storage.del(EMPRESA_KEY) : storage.set(EMPRESA_KEY, String(id))),
  clear: () => { storage.del(TOKEN_KEY); storage.del(EMPRESA_KEY) },
}

let onUnauthorized = () => {}
export function setUnauthorizedHandler(fn) { onUnauthorized = fn || (() => {}) }

function buildUrl(path, params) {
  const qs = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v))
  })
  const q = qs.toString()
  return `${BASE}${path}${q ? `?${q}` : ''}`
}

export async function request(method, path, { params, body, signal, auth = true } = {}) {
  const headers = { Accept: 'application/json, application/problem+json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = session.getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    const empresaId = session.getEmpresaId()
    if (empresaId) headers['X-Empresa-Id'] = empresaId
  }

  let res
  try {
    res = await fetch(buildUrl(path, params), {
      method,
      headers,
      signal,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (err?.name === 'AbortError') throw err
    throw new ApiError(0, { detail: 'No se pudo conectar con el servidor. Verifica que la API esté en línea.' })
  }

  if (res.status === 204) return null
  const text = await res.text()
  let data = null
  if (text) { try { data = JSON.parse(text) } catch { data = null } }

  if (!res.ok) {
    if (res.status === 401 && auth) { session.clear(); onUnauthorized() }
    throw new ApiError(res.status, data)
  }
  return data
}

export const api = {
  get: (path, params, opts) => request('GET', path, { params, ...opts }),
  post: (path, body, opts) => request('POST', path, { body: body ?? {}, ...opts }),
  put: (path, body, opts) => request('PUT', path, { body: body ?? {}, ...opts }),
  delete: (path, opts) => request('DELETE', path, opts),
}
