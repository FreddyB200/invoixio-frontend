import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, USUARIOS } from '../../test/renderWithProviders.jsx'
import { ApiError } from '../../api/client.js'
import ServiciosPage from '../../pages/ServiciosPage.jsx'
import { listarServicios } from '../../api/servicios.js'
import { aplicarAjusteIpc, listarAjustes, listarTodosGrupos } from '../../api/tarifas.js'
import { AJUSTE_2025, AJUSTE_GRUPO, GRUPO_NORTE, GRUPO_SUR, pagina } from './fixtures.js'

vi.mock('../../api/servicios.js', () => ({
  listarServicios: vi.fn(),
  listarTodosServicios: vi.fn(),
}))
vi.mock('../../api/tarifas.js', () => ({
  aplicarAjusteIpc: vi.fn(),
  listarAjustes: vi.fn(),
  listarTodosGrupos: vi.fn(),
}))

async function abrirAjuste(opciones) {
  renderWithProviders(<ServiciosPage />, opciones)
  await userEvent.click(screen.getByRole('tab', { name: 'Ajuste anual (IPC)' }))
  await screen.findByRole('table', { name: /Bitácora/ })
}

async function llenarFormulario({ anio = '2027', porcentaje = '5,2', grupo } = {}) {
  await userEvent.click(screen.getByRole('button', { name: /Aplicar ajuste anual/ }))
  const dialogo = await screen.findByRole('dialog', { name: 'Ajustar tarifas' })
  const campoAnio = within(dialogo).getByLabelText(/^Año/)
  await userEvent.clear(campoAnio)
  await userEvent.type(campoAnio, anio)
  await userEvent.type(within(dialogo).getByLabelText(/^Porcentaje/), porcentaje)
  if (grupo) {
    await within(dialogo).findByRole('option', { name: grupo })
    await userEvent.selectOptions(within(dialogo).getByLabelText('Ámbito'), grupo)
  }
  return dialogo
}

beforeEach(() => {
  vi.resetAllMocks()
  listarServicios.mockResolvedValue(pagina([]))
  listarAjustes.mockResolvedValue([AJUSTE_GRUPO, AJUSTE_2025])
  listarTodosGrupos.mockResolvedValue([GRUPO_NORTE, GRUPO_SUR])
})

describe('Ajuste anual (IPC)', () => {
  it('lista la bitácora de ajustes con ámbito, conteos y fecha', async () => {
    await abrirAjuste()
    const tabla = screen.getByRole('table', { name: /Bitácora/ })
    const filaEmpresa = within(tabla).getByRole('row', { name: /2025/ })
    expect(filaEmpresa).toHaveTextContent('+5,2 %')
    expect(filaEmpresa).toHaveTextContent('Toda la empresa')
    expect(filaEmpresa).toHaveTextContent('12')
    expect(filaEmpresa).toHaveTextContent('03/02/2025')
    const filaGrupo = within(tabla).getByRole('row', { name: /2026/ })
    expect(filaGrupo).toHaveTextContent('Torre Sur')
    expect(listarAjustes).toHaveBeenCalledTimes(1)
  })

  it('muestra el estado vacío cuando no hay ajustes previos', async () => {
    listarAjustes.mockResolvedValueOnce([])
    renderWithProviders(<ServiciosPage />)
    await userEvent.click(screen.getByRole('tab', { name: 'Ajuste anual (IPC)' }))
    expect(await screen.findByText('Aún no se han aplicado ajustes')).toBeInTheDocument()
  })

  it('muestra el error de la bitácora y permite reintentar', async () => {
    listarAjustes.mockRejectedValueOnce(new ApiError(500, { detail: 'Bitácora no disponible' }))
    renderWithProviders(<ServiciosPage />)
    await userEvent.click(screen.getByRole('tab', { name: 'Ajuste anual (IPC)' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Bitácora no disponible')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('table', { name: /Bitácora/ })).toBeInTheDocument()
  })

  it('muestra la carga de la bitácora', async () => {
    listarAjustes.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<ServiciosPage />)
    await userEvent.click(screen.getByRole('tab', { name: 'Ajuste anual (IPC)' }))
    expect(screen.getByRole('status')).toHaveTextContent('Cargando bitácora')
  })

  it('pide confirmación con el efecto esperado antes de llamar a la API', async () => {
    await abrirAjuste()
    const dialogo = await llenarFormulario()
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Revisar ajuste' }))
    expect(aplicarAjusteIpc).not.toHaveBeenCalled()
    const aviso = within(dialogo).getByText(/Se multiplicarán/)
    expect(aviso).toHaveTextContent(
      'Se multiplicarán todas las tarifas y overrides de toda la empresa por 1,052 (+5,2 %). Esto no se puede repetir en 2027.',
    )
  })

  it('aplica el ajuste de toda la empresa con el payload exacto y muestra el resultado', async () => {
    aplicarAjusteIpc.mockResolvedValue({ ...AJUSTE_2025, id: 9, anio: 2027, tarifasAfectadas: 14, overridesAfectados: 3 })
    await abrirAjuste()
    const dialogo = await llenarFormulario()
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Revisar ajuste' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Aplicar ajuste' }))
    expect(aplicarAjusteIpc).toHaveBeenCalledWith({ anio: 2027, porcentaje: 5.2 })
    expect(await within(dialogo).findByText('14 tarifas · 3 overrides')).toBeInTheDocument()
    expect(listarAjustes).toHaveBeenCalledTimes(2)
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Listo' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('limita el ajuste a un grupo enviando grupoId y nombrándolo en la confirmación', async () => {
    aplicarAjusteIpc.mockResolvedValue({ ...AJUSTE_GRUPO, anio: 2027, porcentaje: -3.5 })
    await abrirAjuste()
    const dialogo = await llenarFormulario({ porcentaje: '-3.5', grupo: 'Torre Sur' })
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Revisar ajuste' }))
    expect(within(dialogo).getByText(/Se multiplicarán/)).toHaveTextContent('del grupo Torre Sur por 0,965')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Aplicar ajuste' }))
    expect(aplicarAjusteIpc).toHaveBeenCalledWith({ anio: 2027, porcentaje: -3.5, grupoId: 2 })
  })

  it('muestra el 409 cuando el ajuste ya se aplicó ese año y ámbito', async () => {
    aplicarAjusteIpc.mockRejectedValue(new ApiError(409, { detail: 'Ya se aplicó un ajuste de tarifas en 2027 que cubre estas tarifas.' }))
    await abrirAjuste()
    const dialogo = await llenarFormulario()
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Revisar ajuste' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Aplicar ajuste' }))
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent('Ya se aplicó un ajuste de tarifas en 2027')
    expect(within(dialogo).getByRole('button', { name: 'Volver' })).toBeEnabled()
    expect(listarAjustes).toHaveBeenCalledTimes(1)
  })

  it('valida año y rango del porcentaje sin llamar a la API', async () => {
    await abrirAjuste()
    const dialogo = await llenarFormulario({ anio: '1999', porcentaje: '-50' })
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Revisar ajuste' }))
    expect(within(dialogo).getByText('El año debe estar entre 2000 y 2100.')).toBeInTheDocument()
    expect(within(dialogo).getByText(/mayor que -50 y no superar 100/)).toBeInTheDocument()
    expect(within(dialogo).queryByText(/Se multiplicarán/)).not.toBeInTheDocument()
    expect(aplicarAjusteIpc).not.toHaveBeenCalled()
  })

  it('para CONTADOR ve la bitácora pero no puede aplicar ajustes', async () => {
    await abrirAjuste({ usuario: USUARIOS.contador })
    expect(screen.getByRole('table', { name: /Bitácora/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Aplicar ajuste anual/ })).not.toBeInTheDocument()
  })
})
