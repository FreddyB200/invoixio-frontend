import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, USUARIOS } from '../../test/renderWithProviders.jsx'
import { ApiError } from '../../api/client.js'
import ServiciosPage from '../../pages/ServiciosPage.jsx'
import { actualizarServicio, crearServicio, desactivarServicio, listarServicios } from '../../api/servicios.js'
import { SERVICIO_ADMIN, SERVICIO_PARQ, SERVICIO_VIEJO, pagina } from './fixtures.js'

vi.mock('../../api/servicios.js', () => ({
  listarServicios: vi.fn(),
  listarTodosServicios: vi.fn(),
  crearServicio: vi.fn(),
  actualizarServicio: vi.fn(),
  desactivarServicio: vi.fn(),
}))
vi.mock('../../api/tarifas.js', () => ({}))

beforeEach(() => {
  vi.resetAllMocks()
  listarServicios.mockResolvedValue(pagina([SERVICIO_ADMIN, SERVICIO_PARQ, SERVICIO_VIEJO]))
})

describe('Servicios: catálogo', () => {
  it('lista los servicios con su aplicación explicada y estado', async () => {
    renderWithProviders(<ServiciosPage />)
    const tabla = await screen.findByRole('table', { name: 'Lista de servicios' })
    expect(within(tabla).getByText('Administración')).toBeInTheDocument()
    expect(within(tabla).getByText('Cuota mensual de administración')).toBeInTheDocument()
    expect(within(tabla).getByText('ADMIN')).toBeInTheDocument()
    expect(within(tabla).getAllByText(/Se factura a todos los clientes activos del grupo/)).toHaveLength(2)
    expect(within(tabla).getByText(/Solo se factura a los clientes con tarifa propia/)).toBeInTheDocument()
    expect(within(tabla).getByText('Inactivo')).toBeInTheDocument()
    expect(listarServicios).toHaveBeenCalledWith({ activo: undefined, page: 0, size: 20 })
  })

  it('muestra el estado de carga', () => {
    listarServicios.mockReturnValue(new Promise(() => {}))
    renderWithProviders(<ServiciosPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando servicios')
  })

  it('muestra el error y permite reintentar', async () => {
    listarServicios.mockRejectedValueOnce(new ApiError(500, { detail: 'Falla del servidor' }))
    renderWithProviders(<ServiciosPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Falla del servidor')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Parqueadero')).toBeInTheDocument()
    expect(listarServicios).toHaveBeenCalledTimes(2)
  })

  it('muestra el estado vacío', async () => {
    listarServicios.mockResolvedValue(pagina([]))
    renderWithProviders(<ServiciosPage />)
    expect(await screen.findByText('Aún no hay servicios')).toBeInTheDocument()
  })

  it('filtra por estado llamando a la API con activo=true', async () => {
    renderWithProviders(<ServiciosPage />)
    await screen.findByText('Parqueadero')
    await userEvent.selectOptions(screen.getByLabelText('Mostrar'), 'true')
    expect(listarServicios).toHaveBeenLastCalledWith({ activo: true, page: 0, size: 20 })
  })

  it('crea un servicio con el payload exacto', async () => {
    crearServicio.mockResolvedValue({ id: 99 })
    renderWithProviders(<ServiciosPage />)
    await screen.findByText('Parqueadero')
    await userEvent.click(screen.getByRole('button', { name: /Nuevo servicio/ }))
    const dialogo = screen.getByRole('dialog', { name: 'Nuevo servicio' })
    await userEvent.type(within(dialogo).getByLabelText(/^Código/), 'LAV')
    await userEvent.type(within(dialogo).getByLabelText(/^Nombre/), 'Lavandería')
    await userEvent.type(within(dialogo).getByLabelText('Descripción'), 'Uso de lavadoras')
    await userEvent.click(within(dialogo).getByRole('radio', { name: /Opcional/ }))
    await userEvent.click(within(dialogo).getByRole('button', { name: /Guardar servicio/ }))
    expect(crearServicio).toHaveBeenCalledWith({
      codigo: 'LAV', nombre: 'Lavandería', descripcion: 'Uso de lavadoras', aplicacion: 'OPCIONAL', activo: true,
    })
    expect(await screen.findByText('Servicio creado')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(listarServicios).toHaveBeenCalledTimes(2)
  })

  it('valida los campos obligatorios y el formato del código sin llamar a la API', async () => {
    renderWithProviders(<ServiciosPage />)
    await screen.findByText('Parqueadero')
    await userEvent.click(screen.getByRole('button', { name: /Nuevo servicio/ }))
    const dialogo = screen.getByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: /Guardar servicio/ }))
    expect(within(dialogo).getByText('El código es obligatorio')).toBeInTheDocument()
    expect(within(dialogo).getByText('El nombre es obligatorio')).toBeInTheDocument()
    await userEvent.type(within(dialogo).getByLabelText(/^Código/), 'con espacio')
    await userEvent.click(within(dialogo).getByRole('button', { name: /Guardar servicio/ }))
    expect(within(dialogo).getByText(/solo admite letras/)).toBeInTheDocument()
    expect(crearServicio).not.toHaveBeenCalled()
  })

  it('edita un servicio enviando su id y el payload completo', async () => {
    actualizarServicio.mockResolvedValue({})
    renderWithProviders(<ServiciosPage />)
    await screen.findByText('Parqueadero')
    await userEvent.click(screen.getByRole('button', { name: 'Editar Parqueadero' }))
    const dialogo = screen.getByRole('dialog', { name: 'Editar servicio' })
    const nombre = within(dialogo).getByLabelText(/^Nombre/)
    await userEvent.clear(nombre)
    await userEvent.type(nombre, 'Parqueadero cubierto')
    await userEvent.click(within(dialogo).getByRole('button', { name: /Guardar servicio/ }))
    expect(actualizarServicio).toHaveBeenCalledWith(11, {
      codigo: 'PARQ', nombre: 'Parqueadero cubierto', descripcion: null, aplicacion: 'OPCIONAL', activo: true,
    })
  })

  it('muestra el 409 de código duplicado dentro del formulario', async () => {
    crearServicio.mockRejectedValue(new ApiError(409, { detail: 'Ya existe un servicio con el código ADMIN' }))
    renderWithProviders(<ServiciosPage />)
    await screen.findByText('Parqueadero')
    await userEvent.click(screen.getByRole('button', { name: /Nuevo servicio/ }))
    const dialogo = screen.getByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText(/^Código/), 'ADMIN')
    await userEvent.type(within(dialogo).getByLabelText(/^Nombre/), 'Otro')
    await userEvent.click(within(dialogo).getByRole('button', { name: /Guardar servicio/ }))
    expect(await within(dialogo).findByRole('alert')).toHaveTextContent('Ya existe un servicio con el código ADMIN')
  })

  it('pinta los errores por campo que devuelve la API', async () => {
    crearServicio.mockRejectedValue(new ApiError(400, { title: 'Datos inválidos', errores: { nombre: 'El nombre es obligatorio (servidor)' } }))
    renderWithProviders(<ServiciosPage />)
    await screen.findByText('Parqueadero')
    await userEvent.click(screen.getByRole('button', { name: /Nuevo servicio/ }))
    const dialogo = screen.getByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText(/^Código/), 'X1')
    await userEvent.type(within(dialogo).getByLabelText(/^Nombre/), 'X')
    await userEvent.click(within(dialogo).getByRole('button', { name: /Guardar servicio/ }))
    expect(await within(dialogo).findByText('El nombre es obligatorio (servidor)')).toBeInTheDocument()
  })

  it('desactiva solo después de confirmar y no ofrece desactivar los inactivos', async () => {
    desactivarServicio.mockResolvedValue(null)
    renderWithProviders(<ServiciosPage />)
    await screen.findByText('Parqueadero')
    expect(screen.queryByRole('button', { name: 'Desactivar Salón comunal' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Desactivar Parqueadero' }))
    expect(desactivarServicio).not.toHaveBeenCalled()
    const dialogo = screen.getByRole('dialog', { name: 'Desactivar servicio' })
    expect(dialogo).toHaveTextContent('Parqueadero')
    await userEvent.click(within(dialogo).getByRole('button', { name: /Sí, desactivar/ }))
    expect(desactivarServicio).toHaveBeenCalledWith(11)
    expect(await screen.findByText('Servicio desactivado')).toBeInTheDocument()
  })

  it('para CONTADOR es solo lectura: sin crear, editar ni desactivar', async () => {
    renderWithProviders(<ServiciosPage />, { usuario: USUARIOS.contador })
    await screen.findByText('Parqueadero')
    expect(screen.getByText(/Modo de solo lectura/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nuevo servicio/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Desactivar/ })).not.toBeInTheDocument()
  })
})
