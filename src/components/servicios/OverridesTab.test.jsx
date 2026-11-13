import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, USUARIOS } from '../../test/renderWithProviders.jsx'
import { ApiError } from '../../api/client.js'
import ServiciosPage from '../../pages/ServiciosPage.jsx'
import { listarServicios, listarTodosServicios } from '../../api/servicios.js'
import { buscarClientes, guardarOverride, listarOverrides, listarTarifas, quitarOverride } from '../../api/tarifas.js'
import { CLIENTE_MARIA, OVERRIDE_PARQ, SERVICIO_ADMIN, SERVICIO_PARQ, TARIFAS, pagina } from './fixtures.js'

vi.mock('../../api/servicios.js', () => ({
  listarServicios: vi.fn(),
  listarTodosServicios: vi.fn(),
}))
vi.mock('../../api/tarifas.js', () => ({
  buscarClientes: vi.fn(),
  listarOverrides: vi.fn(),
  listarTarifas: vi.fn(),
  guardarOverride: vi.fn(),
  quitarOverride: vi.fn(),
}))

async function seleccionarCliente(opciones) {
  renderWithProviders(<ServiciosPage />, opciones)
  await userEvent.click(screen.getByRole('tab', { name: 'Overrides por cliente' }))
  await userEvent.type(screen.getByLabelText('Buscar cliente'), 'mar')
  await userEvent.click(await screen.findByRole('button', { name: /María Gómez/ }))
  return screen.findByRole('table', { name: 'Servicios de María Gómez' })
}

beforeEach(() => {
  vi.resetAllMocks()
  listarServicios.mockResolvedValue(pagina([]))
  buscarClientes.mockResolvedValue(pagina([CLIENTE_MARIA]))
  listarTodosServicios.mockResolvedValue([SERVICIO_ADMIN, SERVICIO_PARQ])
  listarOverrides.mockResolvedValue([OVERRIDE_PARQ])
  listarTarifas.mockResolvedValue(TARIFAS.filter((t) => t.grupoId === 1))
})

describe('Overrides por cliente', () => {
  it('busca con debounce, una sola llamada, y muestra los overrides del cliente elegido', async () => {
    const tabla = await seleccionarCliente()
    expect(buscarClientes).toHaveBeenCalledTimes(1)
    expect(buscarClientes).toHaveBeenCalledWith({ q: 'mar', size: 10 })
    expect(listarOverrides).toHaveBeenCalledWith(7)
    expect(listarTarifas).toHaveBeenCalledWith(1)
    const filaParq = within(tabla).getByRole('row', { name: /Parqueadero/ })
    expect(within(filaParq).getByText('$ 95.000')).toBeInTheDocument()
    expect(within(filaParq).getByText('$ 80.000')).toBeInTheDocument()
    const filaAdmin = within(tabla).getByRole('row', { name: /Administración/ })
    expect(within(filaAdmin).getByText('Sin valor propio')).toBeInTheDocument()
  })

  it('explica que en servicios opcionales el override suscribe al cliente', async () => {
    renderWithProviders(<ServiciosPage />)
    await userEvent.click(screen.getByRole('tab', { name: 'Overrides por cliente' }))
    expect(screen.getByText(/lo que suscribe al cliente/)).toBeInTheDocument()
    expect(screen.getByText('Elige un cliente')).toBeInTheDocument()
  })

  it('agrega un override con el cliente y servicio correctos', async () => {
    guardarOverride.mockResolvedValue({})
    const tabla = await seleccionarCliente()
    await userEvent.click(within(tabla).getByRole('button', { name: 'Agregar valor para Administración' }))
    const dialogo = screen.getByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText(/Valor mensual/), '230000')
    await userEvent.click(within(dialogo).getByRole('button', { name: /Guardar valor/ }))
    expect(guardarOverride).toHaveBeenCalledWith(7, 10, 230000)
    expect(await screen.findByText('Valor propio agregado')).toBeInTheDocument()
    expect(listarOverrides).toHaveBeenCalledTimes(2)
  })

  it('avisa que agregar un override a un servicio opcional suscribe al cliente', async () => {
    listarOverrides.mockResolvedValue([])
    const tabla = await seleccionarCliente()
    await userEvent.click(within(tabla).getByRole('button', { name: 'Agregar valor para Parqueadero' }))
    expect(within(screen.getByRole('dialog')).getByText(/queda suscrito/)).toBeInTheDocument()
  })

  it('edita un override existente precargando su valor', async () => {
    guardarOverride.mockResolvedValue({})
    const tabla = await seleccionarCliente()
    await userEvent.click(within(tabla).getByRole('button', { name: 'Editar valor de Parqueadero' }))
    const campo = screen.getByLabelText(/Valor mensual/)
    expect(campo).toHaveValue(95000)
    await userEvent.clear(campo)
    await userEvent.type(campo, '100000')
    await userEvent.click(screen.getByRole('button', { name: /Guardar valor/ }))
    expect(guardarOverride).toHaveBeenCalledWith(7, 11, 100000)
  })

  it('rechaza valores negativos en el override', async () => {
    const tabla = await seleccionarCliente()
    await userEvent.click(within(tabla).getByRole('button', { name: 'Agregar valor para Administración' }))
    await userEvent.type(screen.getByLabelText(/Valor mensual/), '-10')
    await userEvent.click(screen.getByRole('button', { name: /Guardar valor/ }))
    expect(guardarOverride).not.toHaveBeenCalled()
    expect(within(screen.getByRole('dialog')).getByRole('alert')).toHaveTextContent('mayor o igual a 0')
  })

  it('quita un override solo tras confirmar', async () => {
    quitarOverride.mockResolvedValue(null)
    const tabla = await seleccionarCliente()
    await userEvent.click(within(tabla).getByRole('button', { name: 'Quitar valor de Parqueadero' }))
    expect(quitarOverride).not.toHaveBeenCalled()
    const dialogo = screen.getByRole('dialog', { name: 'Quitar valor propio' })
    expect(dialogo).toHaveTextContent('deja de estar suscrito')
    await userEvent.click(within(dialogo).getByRole('button', { name: /Sí, quitar/ }))
    expect(quitarOverride).toHaveBeenCalledWith(7, 11)
    expect(await screen.findByText('Valor propio quitado')).toBeInTheDocument()
  })

  it('muestra el error del servidor al guardar', async () => {
    guardarOverride.mockRejectedValue(new ApiError(404, { detail: 'Cliente no encontrado' }))
    const tabla = await seleccionarCliente()
    await userEvent.click(within(tabla).getByRole('button', { name: 'Agregar valor para Administración' }))
    await userEvent.type(screen.getByLabelText(/Valor mensual/), '1000')
    await userEvent.click(screen.getByRole('button', { name: /Guardar valor/ }))
    expect(await screen.findByText('Cliente no encontrado')).toBeInTheDocument()
  })

  it('avisa cuando no hay coincidencias', async () => {
    buscarClientes.mockResolvedValue(pagina([]))
    renderWithProviders(<ServiciosPage />)
    await userEvent.click(screen.getByRole('tab', { name: 'Overrides por cliente' }))
    await userEvent.type(screen.getByLabelText('Buscar cliente'), 'zzz')
    expect(await screen.findByText('Sin coincidencias')).toBeInTheDocument()
  })

  it('muestra el error al cargar los overrides del cliente', async () => {
    listarOverrides.mockRejectedValue(new ApiError(500, { detail: 'Falla al leer overrides' }))
    renderWithProviders(<ServiciosPage />)
    await userEvent.click(screen.getByRole('tab', { name: 'Overrides por cliente' }))
    await userEvent.type(screen.getByLabelText('Buscar cliente'), 'mar')
    await userEvent.click(await screen.findByRole('button', { name: /María Gómez/ }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Falla al leer overrides'))
  })

  it('para CONTADOR muestra los valores pero sin acciones de escritura', async () => {
    const tabla = await seleccionarCliente({ usuario: USUARIOS.contador })
    expect(within(tabla).getByText('$ 95.000')).toBeInTheDocument()
    expect(within(tabla).queryByRole('button')).not.toBeInTheDocument()
  })
})
