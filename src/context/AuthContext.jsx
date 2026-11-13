/**
 * AuthContext.jsx - Sesion real contra la API (JWT).
 * - login: POST /api/auth/login, guarda el token y el usuario.
 * - Restaura la sesion al recargar (GET /api/auth/me).
 * - ADMIN_GENERAL no tiene empresa propia: elige una (selector del Topbar) y se envia como X-Empresa-Id.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth.js'
import { session, setUnauthorizedHandler } from '../api/client.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(() => !!session.getToken())
  const [empresas, setEmpresas] = useState([])
  const [empresaId, setEmpresaIdState] = useState(null)

  const prepararEmpresa = useCallback(async (u) => {
    if (u.rol !== 'ADMIN_GENERAL') {
      session.setEmpresaId(null)
      setEmpresas([])
      setEmpresaIdState(u.empresaId)
      return
    }
    const page = await authApi.listarEmpresas()
    const lista = page?.content ?? []
    setEmpresas(lista)
    const guardada = Number(session.getEmpresaId())
    const elegida = lista.find((e) => e.id === guardada) ?? lista[0] ?? null
    session.setEmpresaId(elegida?.id ?? null)
    setEmpresaIdState(elegida?.id ?? null)
  }, [])

  const cerrarLocal = useCallback(() => {
    session.clear()
    setUser(null)
    setEmpresas([])
    setEmpresaIdState(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(cerrarLocal)
    return () => setUnauthorizedHandler(null)
  }, [cerrarLocal])

  useEffect(() => {
    if (!session.getToken()) return undefined
    let activo = true
    authApi.me()
      .then(async (u) => { await prepararEmpresa(u); if (activo) setUser(u) })
      .catch(() => { if (activo) cerrarLocal() })
      .finally(() => { if (activo) setInitializing(false) })
    return () => { activo = false }
  }, [prepararEmpresa, cerrarLocal])

  /** Lanza ApiError si las credenciales son invalidas. */
  const login = useCallback(async (email, password) => {
    const r = await authApi.login(email.trim(), password)
    session.setToken(r.token)
    try {
      await prepararEmpresa(r.usuario)
    } catch (err) {
      cerrarLocal()
      throw err
    }
    setUser(r.usuario)
    return r.usuario
  }, [prepararEmpresa, cerrarLocal])

  const logout = useCallback(() => { cerrarLocal() }, [cerrarLocal])

  const cambiarEmpresa = useCallback((id) => {
    session.setEmpresaId(id)
    setEmpresaIdState(Number(id))
  }, [])

  const value = useMemo(() => ({
    user,
    initializing,
    isAuthenticated: !!user,
    login,
    logout,
    empresaId,
    empresas,
    cambiarEmpresa,
    esGeneral: user?.rol === 'ADMIN_GENERAL',
    /** CONTADOR solo lectura en maestros y tarifas; opera facturas. */
    puedeEscribirMaestros: !!user && user.rol !== 'CONTADOR',
    puedeVerEmpleados: !!user && user.rol !== 'CONTADOR',
  }), [user, initializing, login, logout, empresaId, empresas, cambiarEmpresa])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider')
  return context
}
