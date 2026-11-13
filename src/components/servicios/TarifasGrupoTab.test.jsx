import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, USUARIOS } from '../../test/renderWithProviders.jsx'
import { ApiError } from '../../api/client.js'
import ServiciosPage from '../../pages/ServiciosPage.jsx'
import { listarServicios, listarTodosServicios } from '../../api/servicios.js'
import { guardarTarifaGrupo, listarTarifas, listarTodosGrupos } from '../../api/tarifas.js'
import { GRUPO_NORTE, GRUPO_SUR, SERVICIO_ADMIN, SERVICIO_PARQ, TARIFAS, pagina } from './fixtures.js'

vi.mock('../../api/servicios.js', () => ({
  listarServicios: vi.fn(),
  listarTodosServicios: vi.fn(),
}))
vi.mock('../../api/tarifas.js', () => ({
  listarTarifas: vi.fn(),
  listarTodosGrupos: vi.fn(),
  guardarTarifaGrupo: vi.fn(),
}))

const celda = (servicio, grupo) => screen.getByLabelText(`Tarifa de ${servicio} para ${grupo}`)

async function abrirMatriz(opciones) {
  const res = renderWithProviders(<ServiciosPage />, opciones)
  await userEvent.click(screen.getByRole('tab', { name: 'Tarifas por grupo' }))
  await screen.findByRole('table', { name: /Matriz de tarifas/ })
  return res
}

beforeEach(() => {
  vi.resetAllMocks()
  listarServicios.mockResolvedValue(pagina([]))
  listarTodosServicios.mockResolvedValue([SERVICIO_ADMIN, SERVICIO_PARQ])
  listarTodosGrupos.mockResolvedValue([GRUPO_NORTE, GRUPO_SUR])
  listarTarifas.mockResolvedValue(TARIFAS)
})

describe('Tarifas por grupo: matriz', () => {
  it('renderiza grupos x servicios con sus valores, cuota base y resumen', async () => {
    await abrirMatriz()
    expect(celda('Administración', 'Torre Norte')).toHaveValue(250000)
    expect(celda('Parqueadero', 'Torre Norte')).toHaveValue(80000)
    expect(celda('Administración', 'Torre Sur')).toHaveValue(180000)
    expect(celda('Parqueadero', 'Torre Sur')).toHaveValue(null)
    expect(listarTodosServicios).toHaveBeenCalledWith({ activo: true })
    expect(listarTodosGrupos).toHaveBeenCalledWith({ activo: true })
    expect(listarTarifas).toHaveBeenCalledWith()
    expect(screen.getByTestId('cuota-1')).toHaveTextContent('$ 250.000')
    expect(screen.getByTestId('cuota-2')).toHaveTextContent('$ 180.000')
    expect(screen.getByText('3 / 4')).toBeInTheDocument()
    expect(screen.getByText('$ 215.000')).toBeInTheDocument()
  })

  it('guarda una tarifa nueva en la ruta del grupo y servicio, y muestra confirmación', async () => {
    guardarTarifaGrupo.mockResolvedValue({ id: 9, grupoId: 2, servicioId: 11, valor: 60000 })
    await abrirMatriz()
    const input = celda('Parqueadero', 'Torre Sur')
    await userEvent.type(input, '60000{Enter}')
    expect(guardarTarifaGrupo).toHaveBeenCalledTimes(1)
    expect(guardarTarifaGrupo).toHaveBeenCalledWith(2, 11, 60000)
    expect(await within(input.closest('td')).findByText('Guardado')).toBeInTheDocument()
    expect(screen.getByText('4 / 4')).toBeInTheDocument()
  })

  it('actualiza la cuota base al cambiar una tarifa de servicio TODOS', async () => {
    guardarTarifaGrupo.mockResolvedValue({ valor: 300000 })
    await abrirMatriz()
    const input = celda('Administración', 'Torre Norte')
    await userEvent.clear(input)
    await userEvent.type(input, '300000')
    await userEvent.tab()
    expect(guardarTarifaGrupo).toHaveBeenCalledWith(1, 10, 300000)
    expect(await screen.findByText('Guardado')).toBeInTheDocument()
    expect(screen.getByTestId('cuota-1')).toHaveTextContent('$ 300.000')
  })

  it('no llama a la API si el valor no cambió', async () => {
    await abrirMatriz()
    const input = celda('Administración', 'Torre Norte')
    await userEvent.click(input)
    await userEvent.tab()
    expect(guardarTarifaGrupo).not.toHaveBeenCalled()
  })

  it('rechaza valores negativos sin llamar a la API', async () => {
    await abrirMatriz()
    const input = celda('Parqueadero', 'Torre Sur')
    await userEvent.type(input, '-5{Enter}')
    expect(guardarTarifaGrupo).not.toHaveBeenCalled()
    expect(within(input.closest('td')).getByRole('alert')).toHaveTextContent('mayor o igual a 0')
  })

  it('una celda vacía sin tarifa previa no genera llamadas; vaciar una existente se rechaza', async () => {
    await abrirMatriz()
    const vacia = celda('Parqueadero', 'Torre Sur')
    await userEvent.click(vacia)
    await userEvent.tab()
    const existente = celda('Administración', 'Torre Sur')
    await userEvent.clear(existente)
    await userEvent.tab()
    expect(guardarTarifaGrupo).not.toHaveBeenCalled()
    expect(within(existente.closest('td')).getByRole('alert')).toHaveTextContent('No se puede quitar una tarifa existente')
    expect(existente).toHaveValue(180000)
  })

  it('muestra el error del servidor en la celda cuando falla el guardado', async () => {
    guardarTarifaGrupo.mockRejectedValue(new ApiError(500, { detail: 'Error interno' }))
    await abrirMatriz()
    const input = celda('Parqueadero', 'Torre Sur')
    await userEvent.type(input, '1000{Enter}')
    expect(await within(input.closest('td')).findByRole('alert')).toHaveTextContent('Error interno')
  })

  it('para CONTADOR muestra los valores como texto y sin campos editables', async () => {
    await abrirMatriz({ usuario: USUARIOS.contador })
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    const fila = screen.getByRole('row', { name: /Torre Norte/ })
    expect(within(fila).getByText('$ 80.000')).toBeInTheDocument()
    expect(screen.getByText(/Solo lectura/)).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando faltan grupos', async () => {
    listarTodosGrupos.mockResolvedValue([])
    renderWithProviders(<ServiciosPage />)
    await userEvent.click(screen.getByRole('tab', { name: 'Tarifas por grupo' }))
    expect(await screen.findByText('No hay con qué armar la matriz')).toBeInTheDocument()
  })

  it('muestra el error de carga con reintento', async () => {
    listarTarifas.mockRejectedValueOnce(new ApiError(500, { detail: 'Sin conexión a la base' }))
    renderWithProviders(<ServiciosPage />)
    await userEvent.click(screen.getByRole('tab', { name: 'Tarifas por grupo' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión a la base')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('table', { name: /Matriz de tarifas/ })).toBeInTheDocument()
  })

  it('muestra el estado de carga', async () => {
    listarTarifas.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<ServiciosPage />)
    await userEvent.click(screen.getByRole('tab', { name: 'Tarifas por grupo' }))
    expect(screen.getByRole('status')).toHaveTextContent('Cargando tarifas')
  })
})
