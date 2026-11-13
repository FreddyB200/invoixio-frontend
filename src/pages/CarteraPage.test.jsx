import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, USUARIOS } from '../test/renderWithProviders.jsx'
import { ApiError } from '../api/client.js'
import CarteraPage from './CarteraPage.jsx'
import * as api from '../api/facturas.js'

vi.mock('../api/facturas.js', () => ({
  listarFacturas: vi.fn(),
  obtenerFactura: vi.fn(),
  generarLote: vi.fn(),
  emitirLote: vi.fn(),
  marcarVencidas: vi.fn(),
  emitirFactura: vi.fn(),
  pagarFactura: vi.fn(),
  eliminarFactura: vi.fn(),
  facturasDeCliente: vi.fn(),
  carteraVencida: vi.fn(),
  listarGrupos: vi.fn(),
}))

const cl = (id, nombre, unidad, grupoNombre) => ({ id, nombre, documento: `100${id}`, unidad, grupoId: id, grupoNombre })

const CARTERA = {
  fechaCorte: '2026-11-13',
  totalClientes: 3,
  totalFacturasVencidas: 6,
  totalAdeudado: 1850000,
  clientes: [
    { cliente: cl(1, 'Ana Torres', 'Apto 101', 'Torre A'), facturasVencidas: 3, totalAdeudado: 900000, diasMoraMaximo: 120 },
    { cliente: cl(2, 'Luis Pérez', 'Apto 202', 'Torre B'), facturasVencidas: 2, totalAdeudado: 700000, diasMoraMaximo: 45 },
    { cliente: cl(3, 'Marta Ríos', 'Apto 303', 'Torre B'), facturasVencidas: 1, totalAdeudado: 250000, diasMoraMaximo: 1 },
  ],
}

const GRUPOS = { content: [{ id: 7, nombre: 'Torre A' }, { id: 8, nombre: 'Torre B' }], page: 0, size: 100, totalElements: 2, totalPages: 1 }

const f = (id, estado, venc, total, periodo = '2026-08') => ({
  id, periodo, numero: `FV-2026-0000${id}`, estado, fechaEmision: '2026-08-01', fechaVencimiento: venc, total, subtotal: total, fechaPago: null,
  cliente: CARTERA.clientes[0].cliente,
})

const FACTURAS_ANA = {
  content: [
    f(11, 'VENCIDA', '2026-07-15', 300000, '2026-07'),
    f(12, 'EMITIDA', '2026-10-10', 300000, '2026-10'),
    f(13, 'EMITIDA', '2026-12-15', 300000, '2026-12'),
    f(14, 'PAGADA', '2026-06-15', 300000, '2026-06'),
  ],
  page: 0, size: 100, totalElements: 4, totalPages: 1,
}

const fila = (nombre) => screen.getByText(nombre).closest('tr')

beforeEach(() => {
  vi.resetAllMocks()
  api.listarGrupos.mockResolvedValue(GRUPOS)
  api.carteraVencida.mockResolvedValue(CARTERA)
  api.facturasDeCliente.mockResolvedValue(FACTURAS_ANA)
})

describe('CarteraPage', () => {
  it('muestra los totales de la cartera', async () => {
    renderWithProviders(<CarteraPage />)
    const totales = await screen.findByLabelText('Totales de cartera')
    await waitFor(() => expect(within(totales).getByText(/1\.850\.000/)).toBeInTheDocument())
    expect(within(totales).getByText('Clientes en mora').closest('.kpi-card')).toHaveTextContent('3')
    expect(within(totales).getByText('Facturas vencidas').closest('.kpi-card')).toHaveTextContent('6')
    expect(within(totales).getByText('13/11/2026')).toBeInTheDocument()
  })

  it('lista cada cliente con unidad, grupo, facturas, deuda y mora máxima', async () => {
    renderWithProviders(<CarteraPage />)
    await screen.findByText('Ana Torres')
    const ana = fila('Ana Torres')
    expect(within(ana).getByText('Apto 101')).toBeInTheDocument()
    expect(within(ana).getByText('Torre A')).toBeInTheDocument()
    expect(within(ana).getByText('3')).toBeInTheDocument()
    expect(within(ana).getByText(/900\.000/)).toBeInTheDocument()
    expect(within(ana).getByText(/120 días/)).toBeInTheDocument()
  })

  it('colorea la mora según su gravedad', async () => {
    renderWithProviders(<CarteraPage />)
    await screen.findByText('Ana Torres')
    expect(within(fila('Ana Torres')).getByText(/120 días/).className).toContain('ca-mora--grave')
    expect(within(fila('Luis Pérez')).getByText(/45 días/).className).toContain('ca-mora--media')
    expect(within(fila('Marta Ríos')).getByText(/1 día/).className).toContain('ca-mora--leve')
  })

  it('filtra por grupo consultando la API', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CarteraPage />)
    await screen.findByText('Ana Torres')
    expect(api.carteraVencida).toHaveBeenLastCalledWith({ grupoId: '' })
    await screen.findByRole('option', { name: 'Torre B' })
    await user.selectOptions(screen.getByLabelText('Filtrar por grupo'), '8')
    await waitFor(() => expect(api.carteraVencida).toHaveBeenLastCalledWith({ grupoId: '8' }))
  })

  it('al expandir un cliente muestra solo sus facturas vencidas impagas', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CarteraPage />)
    await screen.findByText('Ana Torres')
    await user.click(screen.getByRole('button', { name: 'Ver facturas vencidas de Ana Torres' }))
    expect(api.facturasDeCliente).toHaveBeenCalledWith(1, { page: 0, size: 100 })
    const sub = await screen.findByRole('table', { name: 'Facturas vencidas de Ana Torres' })
    expect(within(sub).getByText('FV-2026-000011')).toBeInTheDocument()
    expect(within(sub).getByText('FV-2026-000012')).toBeInTheDocument()
    expect(within(sub).queryByText('FV-2026-000013')).not.toBeInTheDocument()
    expect(within(sub).queryByText('FV-2026-000014')).not.toBeInTheDocument()
    expect(within(fila('FV-2026-000011')).getByText('121')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Ocultar facturas vencidas de Ana Torres' }))
    expect(screen.queryByRole('table', { name: 'Facturas vencidas de Ana Torres' })).not.toBeInTheDocument()
  })

  it('registra un pago rápido con confirmación y recarga la cartera', async () => {
    const user = userEvent.setup()
    api.pagarFactura.mockResolvedValue({ ...FACTURAS_ANA.content[0], estado: 'PAGADA' })
    renderWithProviders(<CarteraPage />, { usuario: USUARIOS.contador })
    await screen.findByText('Ana Torres')
    await user.click(screen.getByRole('button', { name: 'Ver facturas vencidas de Ana Torres' }))
    await user.click(await screen.findByRole('button', { name: 'Registrar pago de FV-2026-000011 de Ana Torres' }))
    const dialogo = screen.getByRole('dialog', { name: 'Registrar pago' })
    expect(api.pagarFactura).not.toHaveBeenCalled()
    const antes = api.carteraVencida.mock.calls.length
    await user.click(within(dialogo).getByRole('button', { name: 'Confirmar pago' }))
    expect(api.pagarFactura).toHaveBeenCalledWith(11)
    expect(await screen.findByText('Pago registrado para FV-2026-000011.')).toBeInTheDocument()
    await waitFor(() => expect(api.carteraVencida.mock.calls.length).toBeGreaterThan(antes))
  })

  it('muestra el error de una transición inválida al pagar', async () => {
    const user = userEvent.setup()
    api.pagarFactura.mockRejectedValue(new ApiError(422, { detail: 'La factura ya está pagada.' }))
    renderWithProviders(<CarteraPage />)
    await screen.findByText('Ana Torres')
    await user.click(screen.getByRole('button', { name: 'Ver facturas vencidas de Ana Torres' }))
    await user.click(await screen.findByRole('button', { name: 'Registrar pago de FV-2026-000012 de Ana Torres' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar pago' }))
    expect(await screen.findByText('No se pudo completar la acción: La factura ya está pagada.')).toBeInTheDocument()
  })

  it('muestra un estado vacío agradable cuando no hay cartera', async () => {
    api.carteraVencida.mockResolvedValue({ fechaCorte: '2026-11-13', totalClientes: 0, totalFacturasVencidas: 0, totalAdeudado: 0, clientes: [] })
    renderWithProviders(<CarteraPage />)
    expect(await screen.findByText('Sin cartera vencida')).toBeInTheDocument()
    expect(screen.getByText(/Todos los clientes están al día/)).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: 'Cartera vencida por cliente' })).not.toBeInTheDocument()
  })

  it('muestra carga y error con reintento', async () => {
    const user = userEvent.setup()
    api.carteraVencida.mockReturnValueOnce(new Promise(() => {}))
    const cargando = renderWithProviders(<CarteraPage />)
    expect(screen.getByText('Cargando cartera…')).toBeInTheDocument()
    cargando.unmount()

    api.carteraVencida.mockRejectedValueOnce(new ApiError(500, { detail: 'Error interno' }))
    renderWithProviders(<CarteraPage />)
    expect(await screen.findByText('Error interno')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()
  })
})
