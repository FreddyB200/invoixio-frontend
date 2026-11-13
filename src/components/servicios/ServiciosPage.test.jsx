import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../test/renderWithProviders.jsx'
import ServiciosPage from '../../pages/ServiciosPage.jsx'
import { listarServicios, listarTodosServicios } from '../../api/servicios.js'
import { listarAjustes, listarTarifas, listarTodosGrupos } from '../../api/tarifas.js'
import { pagina } from './fixtures.js'

vi.mock('../../api/servicios.js', () => ({ listarServicios: vi.fn(), listarTodosServicios: vi.fn() }))
vi.mock('../../api/tarifas.js', () => ({
  listarAjustes: vi.fn(), listarTarifas: vi.fn(), listarTodosGrupos: vi.fn(), buscarClientes: vi.fn(),
}))

beforeEach(() => {
  vi.resetAllMocks()
  listarServicios.mockResolvedValue(pagina([]))
  listarTodosServicios.mockResolvedValue([])
  listarTodosGrupos.mockResolvedValue([])
  listarTarifas.mockResolvedValue([])
  listarAjustes.mockResolvedValue([])
})

describe('ServiciosPage', () => {
  it('muestra las cuatro pestañas y navega entre ellas', async () => {
    renderWithProviders(<ServiciosPage />)
    const pestanas = screen.getAllByRole('tab')
    expect(pestanas.map((p) => p.textContent)).toEqual([
      'Servicios', 'Tarifas por grupo', 'Overrides por cliente', 'Ajuste anual (IPC)',
    ])
    expect(screen.getByRole('tab', { name: 'Servicios' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('tab', { name: 'Ajuste anual (IPC)' }))
    expect(screen.getByRole('tab', { name: 'Ajuste anual (IPC)' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText('Aún no se han aplicado ajustes')).toBeInTheDocument()
  })
})
