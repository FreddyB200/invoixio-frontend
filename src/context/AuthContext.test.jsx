import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext.jsx'
import { session } from '../api/client.js'
import * as authApi from '../api/auth.js'

vi.mock('../api/auth.js')

function Panel() {
  const { user, initializing, login, logout, empresaId, esGeneral, puedeEscribirMaestros } = useAuth()
  if (initializing) return <p>restaurando</p>
  return (
    <div>
      <p data-testid="quien">{user ? `${user.rol}|${empresaId}|${esGeneral}|${puedeEscribirMaestros}` : 'anonimo'}</p>
      <button onClick={() => login('a@b.co', 'x').catch(() => {})}>entrar</button>
      <button onClick={logout}>salir</button>
    </div>
  )
}

const montar = () => render(<AuthProvider><Panel /></AuthProvider>)

describe('AuthProvider', () => {
  beforeEach(() => { vi.resetAllMocks() })
  afterEach(() => { session.clear() })

  it('login guarda el token y expone la empresa del usuario', async () => {
    authApi.login.mockResolvedValue({ token: 'jwt', usuario: { id: 2, rol: 'ADMIN_EMPRESA', empresaId: 5 } })
    montar()
    await userEvent.click(screen.getByText('entrar'))
    await waitFor(() => expect(screen.getByTestId('quien')).toHaveTextContent('ADMIN_EMPRESA|5|false|true'))
    expect(session.getToken()).toBe('jwt')
  })

  it('CONTADOR no puede escribir maestros', async () => {
    authApi.login.mockResolvedValue({ token: 'jwt', usuario: { id: 3, rol: 'CONTADOR', empresaId: 5 } })
    montar()
    await userEvent.click(screen.getByText('entrar'))
    await waitFor(() => expect(screen.getByTestId('quien')).toHaveTextContent('CONTADOR|5|false|false'))
  })

  it('ADMIN_GENERAL elige la primera empresa activa y la guarda como activa', async () => {
    authApi.login.mockResolvedValue({ token: 'jwt', usuario: { id: 1, rol: 'ADMIN_GENERAL', empresaId: null } })
    authApi.listarEmpresas.mockResolvedValue({ content: [{ id: 9, nombre: 'Uno' }, { id: 10, nombre: 'Dos' }] })
    montar()
    await userEvent.click(screen.getByText('entrar'))
    await waitFor(() => expect(screen.getByTestId('quien')).toHaveTextContent('ADMIN_GENERAL|9|true|true'))
    expect(session.getEmpresaId()).toBe('9')
  })

  it('credenciales invalidas dejan la sesion vacia', async () => {
    authApi.login.mockRejectedValue(Object.assign(new Error('x'), { status: 401 }))
    montar()
    await userEvent.click(screen.getByText('entrar'))
    await waitFor(() => expect(authApi.login).toHaveBeenCalled())
    expect(screen.getByTestId('quien')).toHaveTextContent('anonimo')
    expect(session.getToken()).toBeNull()
  })

  it('restaura la sesion con /me cuando hay token guardado', async () => {
    session.setToken('guardado')
    authApi.me.mockResolvedValue({ id: 2, rol: 'ADMIN_EMPRESA', empresaId: 5 })
    montar()
    await waitFor(() => expect(screen.getByTestId('quien')).toHaveTextContent('ADMIN_EMPRESA|5'))
  })

  it('un token invalido en /me cierra la sesion', async () => {
    session.setToken('vencido')
    authApi.me.mockRejectedValue(Object.assign(new Error('x'), { status: 401 }))
    montar()
    await waitFor(() => expect(screen.getByTestId('quien')).toHaveTextContent('anonimo'))
    expect(session.getToken()).toBeNull()
  })

  it('logout limpia usuario y token', async () => {
    authApi.login.mockResolvedValue({ token: 'jwt', usuario: { id: 2, rol: 'ADMIN_EMPRESA', empresaId: 5 } })
    montar()
    await userEvent.click(screen.getByText('entrar'))
    await waitFor(() => expect(screen.getByTestId('quien')).toHaveTextContent('ADMIN_EMPRESA'))
    await userEvent.click(screen.getByText('salir'))
    expect(screen.getByTestId('quien')).toHaveTextContent('anonimo')
    expect(session.getToken()).toBeNull()
  })
})
