import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, USUARIOS } from '../test/renderWithProviders.jsx'
import { ApiError } from '../api/client.js'
import { periodoActual, sumarMeses } from '../utils/format.js'
import FacturasPage from './FacturasPage.jsx'
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

const cliente = (id, nombre, grupoNombre = 'Torre A') => ({
  id, nombre, documento: `9000${id}`, unidad: `Apto ${id}01`, grupoId: id, grupoNombre,
})

const factura = (id, estado, extra = {}) => ({
  id,
  cliente: cliente(id, `Cliente ${id}`),
  periodo: periodoActual(),
  numero: estado === 'BORRADOR' ? null : `FV-2026-00000${id}`,
  estado,
  fechaEmision: estado === 'BORRADOR' ? null : '2026-11-01',
  fechaVencimiento: '2026-11-15',
  subtotal: 100000 * id,
  total: 100000 * id,
  fechaPago: estado === 'PAGADA' ? '2026-11-10' : null,
  ...extra,
})

const BD = [factura(1, 'BORRADOR'), factura(2, 'EMITIDA'), factura(3, 'VENCIDA'), factura(4, 'PAGADA'), factura(5, 'BORRADOR')]

const pagina = (content, page = 0, totalPages = 1) => ({
  content, page, size: 20, totalElements: content.length, totalPages,
})

const GRUPOS = { content: [{ id: 7, nombre: 'Torre A' }, { id: 8, nombre: 'Torre B' }], page: 0, size: 100, totalElements: 2, totalPages: 1 }

function mockListado(datos = BD) {
  api.listarFacturas.mockImplementation(async ({ estado } = {}) =>
    pagina(datos.filter((f) => !estado || f.estado === estado)))
}

const ultimaLlamadaLista = () => api.listarFacturas.mock.calls.filter(([p]) => p.size === 20).at(-1)[0]
const fila = (texto) => screen.getByText(texto).closest('tr')

beforeEach(() => {
  vi.resetAllMocks()
  api.listarGrupos.mockResolvedValue(GRUPOS)
  mockListado()
})

describe('FacturasPage · listado', () => {
  it('muestra número o "Borrador", cliente, grupo, total y estado', async () => {
    renderWithProviders(<FacturasPage />)
    const tabla = await screen.findByRole('table', { name: 'Facturas del periodo' })
    const emitida = fila('FV-2026-000002')
    expect(within(emitida).getByText('Cliente 2')).toBeInTheDocument()
    expect(within(emitida).getAllByText('Torre A').length).toBeGreaterThan(0)
    expect(within(emitida).getByText(/200\.000/)).toBeInTheDocument()
    expect(within(emitida).getByText('Emitida')).toBeInTheDocument()
    expect(within(tabla).getAllByText('Borrador').filter((el) => el.classList.contains('fa-num'))).toHaveLength(2)
  })

  it('consulta el periodo actual, primera página, tamaño 20', async () => {
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    expect(ultimaLlamadaLista()).toMatchObject({ periodo: periodoActual(), page: 0, size: 20 })
  })

  it('franja de KPIs con cantidad y total por estado', async () => {
    renderWithProviders(<FacturasPage />)
    const franja = await screen.findByLabelText(/Resumen de/)
    await waitFor(() => expect(within(franja).getByText(/600\.000/)).toBeInTheDocument())
    expect(within(franja).getByText('Borradores')).toBeInTheDocument()
    expect(within(franja).getAllByText('2 facturas')).toHaveLength(1)
    expect(within(franja).getAllByText('1 factura')).toHaveLength(3)
    expect(within(franja).getByText(/400\.000/)).toBeInTheDocument()
  })

  it('cambiar de periodo consulta la API con el periodo correcto', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    await user.click(screen.getByRole('button', { name: 'Periodo anterior' }))
    await waitFor(() => expect(ultimaLlamadaLista().periodo).toBe(sumarMeses(periodoActual(), -1)))
    await user.click(screen.getByRole('button', { name: 'Periodo siguiente' }))
    await user.click(screen.getByRole('button', { name: 'Periodo siguiente' }))
    await waitFor(() => expect(ultimaLlamadaLista().periodo).toBe(sumarMeses(periodoActual(), 1)))
    await user.click(screen.getByRole('button', { name: 'Periodo actual' }))
    await waitFor(() => expect(ultimaLlamadaLista().periodo).toBe(periodoActual()))
  })

  it('filtra por estado y por grupo', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'VENCIDA')
    await waitFor(() => expect(ultimaLlamadaLista().estado).toBe('VENCIDA'))
    expect(await screen.findByText('Cliente 3')).toBeInTheDocument()
    expect(screen.queryByText('Cliente 2')).not.toBeInTheDocument()

    await screen.findByRole('option', { name: 'Torre B' })
    await user.selectOptions(screen.getByLabelText('Filtrar por grupo'), '8')
    await waitFor(() => expect(ultimaLlamadaLista()).toMatchObject({ estado: 'VENCIDA', grupoId: '8', page: 0 }))
  })

  it('pagina con la API y vuelve a la primera página al filtrar', async () => {
    const user = userEvent.setup()
    api.listarFacturas.mockImplementation(async ({ page }) => ({ ...pagina(BD, page, 3), totalElements: 50 }))
    renderWithProviders(<FacturasPage />)
    await screen.findByText(/50 registros · página 1 de 3/)
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(ultimaLlamadaLista().page).toBe(1))
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'PAGADA')
    await waitFor(() => expect(ultimaLlamadaLista()).toMatchObject({ estado: 'PAGADA', page: 0 }))
  })

  it('muestra estado de carga, error con reintento y vacío', async () => {
    api.listarFacturas.mockReturnValue(new Promise(() => {}))
    const cargando = renderWithProviders(<FacturasPage />)
    expect(screen.getByText('Cargando facturas…')).toBeInTheDocument()
    cargando.unmount()

    const user = userEvent.setup()
    api.listarFacturas.mockRejectedValue(new ApiError(500, { detail: 'Error interno' }))
    const conError = renderWithProviders(<FacturasPage />)
    expect(await screen.findByText('Error interno')).toBeInTheDocument()
    mockListado()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Cliente 1')).toBeInTheDocument()
    conError.unmount()

    mockListado([])
    renderWithProviders(<FacturasPage />)
    expect(await screen.findByText('No hay facturas para estos filtros')).toBeInTheDocument()
  })
})

describe('FacturasPage · acciones por estado', () => {
  const botones = (texto) => within(fila(texto)).queryAllByRole('button').map((b) => b.textContent.trim())

  it('cada acción aparece solo donde corresponde', async () => {
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    expect(botones('Cliente 1')).toEqual(['Ver', 'Emitir', 'Eliminar'])
    expect(botones('Cliente 2')).toEqual(['Ver', 'Registrar pago'])
    expect(botones('Cliente 3')).toEqual(['Ver', 'Registrar pago'])
    expect(botones('Cliente 4')).toEqual(['Ver'])
  })

  it('emite una factura en borrador y recarga el listado', async () => {
    const user = userEvent.setup()
    api.emitirFactura.mockResolvedValue({ ...BD[0], numero: 'FV-2026-000101', estado: 'EMITIDA' })
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    const antes = api.listarFacturas.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Emitir borrador de Cliente 1' }))
    expect(api.emitirFactura).toHaveBeenCalledWith(1)
    expect(await screen.findByText('Factura FV-2026-000101 emitida.')).toBeInTheDocument()
    await waitFor(() => expect(api.listarFacturas.mock.calls.length).toBeGreaterThan(antes))
  })

  it('registrar pago pide confirmación y permite cancelar', async () => {
    const user = userEvent.setup()
    api.pagarFactura.mockResolvedValue({ ...BD[2], estado: 'PAGADA' })
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })

    await user.click(screen.getByRole('button', { name: 'Registrar pago de FV-2026-000003' }))
    const dialogo = screen.getByRole('dialog', { name: 'Registrar pago' })
    expect(within(dialogo).getByText(/300\.000/)).toBeInTheDocument()
    await user.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    expect(api.pagarFactura).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Registrar pago de FV-2026-000003' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar pago' }))
    expect(api.pagarFactura).toHaveBeenCalledWith(3)
    expect(await screen.findByText('Pago registrado para FV-2026-000003.')).toBeInTheDocument()
  })

  it('elimina un borrador solo tras confirmar', async () => {
    const user = userEvent.setup()
    api.eliminarFactura.mockResolvedValue(null)
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    await user.click(screen.getByRole('button', { name: 'Eliminar borrador de Cliente 5' }))
    expect(api.eliminarFactura).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))
    expect(api.eliminarFactura).toHaveBeenCalledWith(5)
    expect(await screen.findByText('Borrador eliminado.')).toBeInTheDocument()
  })

  it('el detalle lista los ítems con cantidad, valor y subtotal', async () => {
    const user = userEvent.setup()
    api.obtenerFactura.mockResolvedValue({
      ...BD[1],
      items: [
        { id: 1, servicioId: 1, servicioCodigo: 'ADM', descripcion: 'Administración', cantidad: 1, valorUnitario: 150000, subtotal: 150000 },
        { id: 2, servicioId: 2, servicioCodigo: 'PAR', descripcion: 'Parqueadero', cantidad: 2, valorUnitario: 25000, subtotal: 50000 },
      ],
    })
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    await user.click(screen.getByRole('button', { name: 'Ver detalle de FV-2026-000002' }))
    expect(api.obtenerFactura).toHaveBeenCalledWith(2)
    const items = await screen.findByRole('table', { name: 'Ítems de la factura' })
    expect(within(items).getByText('Administración')).toBeInTheDocument()
    const parqueadero = within(items).getByText('Parqueadero').closest('tr')
    expect(within(parqueadero).getByText('2')).toBeInTheDocument()
    expect(within(parqueadero).getByText(/25\.000/)).toBeInTheDocument()
    expect(within(parqueadero).getByText(/50\.000/)).toBeInTheDocument()
  })
})

describe('FacturasPage · lote', () => {
  it('genera facturas con el payload correcto y muestra el resultado', async () => {
    const user = userEvent.setup()
    api.generarLote.mockResolvedValue({ periodo: '2026-09', creadas: 12, omitidasExistentes: 3, omitidasSinServicios: 1 })
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    await user.click(screen.getByRole('button', { name: 'Generar facturas del periodo' }))
    const dialogo = screen.getByRole('dialog', { name: 'Generar facturas del periodo' })
    expect(within(dialogo).getByLabelText('Periodo')).toHaveValue(periodoActual())
    fireEvent.change(within(dialogo).getByLabelText('Periodo'), { target: { value: '2026-09' } })
    await user.selectOptions(within(dialogo).getByLabelText('Grupo (opcional)'), '7')
    await user.type(within(dialogo).getByLabelText(/Día de vencimiento/), '20')
    await user.click(within(dialogo).getByRole('button', { name: 'Generar facturas' }))

    expect(api.generarLote).toHaveBeenCalledWith({ periodo: '2026-09', grupoId: 7, diasVencimiento: 20 })
    const resultado = await screen.findByRole('status')
    expect(within(resultado).getByText('12')).toBeInTheDocument()
    expect(within(resultado).getByText('creadas')).toBeInTheDocument()
    expect(within(resultado).getByText('3')).toBeInTheDocument()
    expect(within(resultado).getByText('omitidas, ya existían')).toBeInTheDocument()
    expect(within(resultado).getByText('omitidas, sin servicios')).toBeInTheDocument()
  })

  it('omite grupo y días cuando no se indican', async () => {
    const user = userEvent.setup()
    api.generarLote.mockResolvedValue({ periodo: periodoActual(), creadas: 0, omitidasExistentes: 5, omitidasSinServicios: 0 })
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    await user.click(screen.getByRole('button', { name: 'Generar facturas del periodo' }))
    await user.click(screen.getByRole('button', { name: 'Generar facturas' }))
    expect(api.generarLote).toHaveBeenCalledWith({ periodo: periodoActual(), grupoId: undefined, diasVencimiento: undefined })
  })

  it('valida los días de vencimiento antes de llamar a la API', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    await user.click(screen.getByRole('button', { name: 'Generar facturas del periodo' }))
    await user.type(screen.getByLabelText(/Día de vencimiento/), '40')
    await user.click(screen.getByRole('button', { name: 'Generar facturas' }))
    expect(await screen.findByText('Los días de vencimiento deben estar entre 1 y 31.')).toBeInTheDocument()
    expect(api.generarLote).not.toHaveBeenCalled()
  })

  it('muestra el 422 de periodo futuro sin cerrar el formulario', async () => {
    const user = userEvent.setup()
    api.generarLote.mockRejectedValue(new ApiError(422, { detail: 'No se pueden generar facturas de un periodo futuro.' }))
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    await user.click(screen.getByRole('button', { name: 'Generar facturas del periodo' }))
    await user.click(screen.getByRole('button', { name: 'Generar facturas' }))
    expect(await screen.findByText(/No se pueden generar facturas de un periodo futuro/)).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Generar facturas del periodo' })).toBeInTheDocument()
  })

  it('emite los borradores del periodo tras confirmar', async () => {
    const user = userEvent.setup()
    api.emitirLote.mockResolvedValue({ periodo: periodoActual(), emitidas: 2, primerNumero: 'FV-2026-000010', ultimoNumero: 'FV-2026-000011' })
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    await user.selectOptions(screen.getByLabelText('Filtrar por grupo'), '7')
    await user.click(screen.getByRole('button', { name: 'Emitir borradores' }))
    expect(api.emitirLote).not.toHaveBeenCalled()
    const dialogo = screen.getByRole('dialog', { name: 'Emitir borradores' })
    expect(within(dialogo).getByText(/del grupo Torre A/)).toBeInTheDocument()
    await user.click(within(dialogo).getByRole('button', { name: 'Emitir borradores' }))
    expect(api.emitirLote).toHaveBeenCalledWith({ periodo: periodoActual(), grupoId: 7 })
    expect(await screen.findByText('2 facturas emitidas (FV-2026-000010 a FV-2026-000011).')).toBeInTheDocument()
  })

  it('marca las facturas vencidas e informa la cantidad', async () => {
    const user = userEvent.setup()
    api.marcarVencidas.mockResolvedValue({ marcadas: 4, fechaCorte: '2026-11-13' })
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    await user.click(screen.getByRole('button', { name: 'Marcar vencidas' }))
    expect(api.marcarVencidas).toHaveBeenCalled()
    expect(await screen.findByText('4 facturas marcadas como vencidas.')).toBeInTheDocument()
  })
})

describe('FacturasPage · errores y roles', () => {
  it('muestra el 422 de una transición inválida y refresca', async () => {
    const user = userEvent.setup()
    api.pagarFactura.mockRejectedValue(new ApiError(422, { detail: 'La factura ya está pagada.' }))
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    const antes = api.listarFacturas.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Registrar pago de FV-2026-000002' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar pago' }))
    expect(await screen.findByText('No se pudo completar la acción: La factura ya está pagada.')).toBeInTheDocument()
    await waitFor(() => expect(api.listarFacturas.mock.calls.length).toBeGreaterThan(antes))
  })

  it('muestra un mensaje claro ante un 404', async () => {
    const user = userEvent.setup()
    api.emitirFactura.mockRejectedValue(new ApiError(404, { detail: 'Factura no encontrada' }))
    renderWithProviders(<FacturasPage />)
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    await user.click(screen.getByRole('button', { name: 'Emitir borrador de Cliente 1' }))
    expect(await screen.findByText(/ya no existe en esta empresa/)).toBeInTheDocument()
  })

  it('el CONTADOR puede generar, emitir y registrar pagos', async () => {
    const user = userEvent.setup()
    api.pagarFactura.mockResolvedValue({ ...BD[1], estado: 'PAGADA' })
    renderWithProviders(<FacturasPage />, { usuario: USUARIOS.contador })
    await screen.findByRole('table', { name: 'Facturas del periodo' })
    expect(screen.getByRole('button', { name: 'Generar facturas del periodo' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Emitir borradores' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Emitir borrador de Cliente 1' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Registrar pago de FV-2026-000002' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar pago' }))
    expect(api.pagarFactura).toHaveBeenCalledWith(2)
  })
})
