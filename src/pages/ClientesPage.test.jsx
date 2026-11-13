import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientesPage from './ClientesPage.jsx'
import { renderWithProviders, USUARIOS } from '../test/renderWithProviders.jsx'
import { ApiError } from '../api/client.js'
import { listarClientes, crearCliente, actualizarCliente, desactivarCliente } from '../api/clientes.js'
import { listarGrupos } from '../api/grupos.js'

vi.mock('../api/clientes.js')
vi.mock('../api/grupos.js')

const GRUPOS = [
  { id: 1, nombre: 'Conjunto Palmas', tipo: 'CONJUNTO', activo: true },
  { id: 2, nombre: 'Sede Norte', tipo: 'SEDE', activo: true },
  { id: 3, nombre: 'Zona Vieja', tipo: 'ZONA', activo: false },
]

const ANA = {
  id: 10, grupoId: 1, grupoNombre: 'Conjunto Palmas', nombre: 'Ana Pérez', tipoDocumento: 'CC',
  documento: '1020304050', email: 'ana@correo.com', telefono: '3001234567', unidad: 'Apto 101', activo: true,
}
const LUIS = {
  id: 11, grupoId: 2, grupoNombre: 'Sede Norte', nombre: 'Luis Gómez', tipoDocumento: 'NIT',
  documento: '900123456-1', email: null, telefono: null, unidad: 'Local 3', activo: false,
}

const pagina = (content, extra = {}) => ({
  content, page: 0, size: 20, totalElements: content.length, totalPages: 1, ...extra,
})

const ultimaLlamada = () => listarClientes.mock.calls.at(-1)[0]

async function llenarFormulario(user, dialog, { nombre = 'María Ruiz', documento = '52111222', unidad = 'Apto 202' } = {}) {
  await user.selectOptions(within(dialog).getByLabelText(/^grupo/i), '1')
  await user.type(within(dialog).getByLabelText(/^nombre/i), nombre)
  await user.type(within(dialog).getByLabelText(/^documento/i), documento)
  await user.type(within(dialog).getByLabelText(/^unidad/i), unidad)
}

beforeEach(() => {
  vi.resetAllMocks()
  listarGrupos.mockResolvedValue(pagina(GRUPOS))
  listarClientes.mockResolvedValue(pagina([ANA, LUIS]))
})

describe('ClientesPage', () => {
  it('muestra el estado de carga y luego las filas con sus datos', async () => {
    renderWithProviders(<ClientesPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando clientes')

    const tabla = await screen.findByRole('table', { name: 'Lista de clientes' })
    expect(within(tabla).getByText('Ana Pérez')).toBeInTheDocument()
    expect(within(tabla).getByText('Conjunto Palmas')).toBeInTheDocument()
    expect(within(tabla).getByText('Apto 101')).toBeInTheDocument()
    expect(within(tabla).getByText('900123456-1')).toBeInTheDocument()
    expect(within(tabla).getByText('Inactivo')).toBeInTheDocument()
    expect(listarClientes).toHaveBeenCalledWith(expect.objectContaining({ page: 0, size: 20 }))
  })

  it('muestra el estado vacío cuando no hay clientes', async () => {
    listarClientes.mockResolvedValue(pagina([]))
    renderWithProviders(<ClientesPage />)
    expect(await screen.findByText('Aún no hay clientes')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('muestra el error y permite reintentar', async () => {
    const user = userEvent.setup()
    listarClientes.mockRejectedValueOnce(new ApiError(500, { detail: 'Error interno del servidor' }))
    renderWithProviders(<ClientesPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor')
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
    expect(listarClientes).toHaveBeenCalledTimes(2)
  })

  it('busca por texto llamando a la API con q tras el debounce', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ClientesPage />)
    await screen.findByText('Ana Pérez')

    listarClientes.mockResolvedValue(pagina([ANA]))
    await user.type(screen.getByRole('searchbox', { name: 'Buscar clientes' }), 'ana')

    await waitFor(() => expect(ultimaLlamada()).toEqual(expect.objectContaining({ q: 'ana', page: 0 })))
    expect(listarClientes.mock.calls.every(([p]) => p.q === undefined || p.q === 'ana')).toBe(true)
  })

  it('filtra por grupo y por estado', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ClientesPage />)
    await screen.findByText('Ana Pérez')
    await screen.findByRole('option', { name: 'Sede Norte' })

    await user.selectOptions(screen.getByLabelText('Filtrar por grupo'), '2')
    await waitFor(() => expect(ultimaLlamada()).toEqual(expect.objectContaining({ grupoId: '2' })))

    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'false')
    await waitFor(() => expect(ultimaLlamada()).toEqual(expect.objectContaining({ grupoId: '2', activo: false })))
  })

  it('pagina con los botones Anterior y Siguiente', async () => {
    const user = userEvent.setup()
    listarClientes.mockResolvedValue(pagina([ANA], { totalElements: 45, totalPages: 3 }))
    renderWithProviders(<ClientesPage />)
    await screen.findByText('Ana Pérez')
    expect(screen.getByText(/página 1 de 3/)).toBeInTheDocument()

    listarClientes.mockResolvedValue(pagina([LUIS], { page: 1, totalElements: 45, totalPages: 3 }))
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('Luis Gómez')).toBeInTheDocument()
    expect(ultimaLlamada()).toEqual(expect.objectContaining({ page: 1 }))
    expect(screen.getByText(/página 2 de 3/)).toBeInTheDocument()
  })

  it('crea un cliente con el payload exacto y recarga la lista', async () => {
    const user = userEvent.setup()
    crearCliente.mockResolvedValue({ ...ANA, id: 99 })
    renderWithProviders(<ClientesPage />)
    await screen.findByText('Ana Pérez')
    await screen.findByRole('option', { name: 'Conjunto Palmas' })

    await user.click(screen.getByRole('button', { name: /nuevo cliente/i }))
    const dialog = screen.getByRole('dialog', { name: 'Nuevo cliente' })
    expect(within(dialog).queryByRole('option', { name: 'Zona Vieja' })).not.toBeInTheDocument()
    await llenarFormulario(user, dialog)
    await user.selectOptions(within(dialog).getByLabelText(/tipo de documento/i), 'NIT')
    await user.type(within(dialog).getByLabelText(/correo/i), 'maria@correo.com')
    await user.click(within(dialog).getByRole('button', { name: /guardar cliente/i }))

    await waitFor(() => expect(crearCliente).toHaveBeenCalledWith({
      grupoId: 1,
      nombre: 'María Ruiz',
      tipoDocumento: 'NIT',
      documento: '52111222',
      email: 'maria@correo.com',
      telefono: null,
      unidad: 'Apto 202',
      activo: true,
    }))
    expect(await screen.findByText('Cliente registrado exitosamente')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(listarClientes).toHaveBeenCalledTimes(2)
  })

  it('valida los campos obligatorios antes de llamar a la API', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ClientesPage />)
    await screen.findByText('Ana Pérez')

    await user.click(screen.getByRole('button', { name: /nuevo cliente/i }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /guardar cliente/i }))

    expect(within(dialog).getByText('El grupo es obligatorio')).toBeInTheDocument()
    expect(within(dialog).getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(within(dialog).getByText('El documento es obligatorio')).toBeInTheDocument()
    expect(within(dialog).getByText('La unidad es obligatoria')).toBeInTheDocument()
    expect(crearCliente).not.toHaveBeenCalled()
  })

  it('edita un cliente precargando sus datos y enviando el PUT completo', async () => {
    const user = userEvent.setup()
    actualizarCliente.mockResolvedValue({ ...ANA, nombre: 'Ana María Pérez' })
    renderWithProviders(<ClientesPage />)
    await screen.findByText('Ana Pérez')
    await screen.findByRole('option', { name: 'Sede Norte' })

    await user.click(screen.getByRole('button', { name: 'Editar Ana Pérez' }))
    const dialog = screen.getByRole('dialog', { name: 'Editar cliente' })
    expect(within(dialog).getByLabelText(/^nombre/i)).toHaveValue('Ana Pérez')
    expect(within(dialog).getByLabelText(/^grupo/i)).toHaveValue('1')

    const nombre = within(dialog).getByLabelText(/^nombre/i)
    await user.clear(nombre)
    await user.type(nombre, 'Ana María Pérez')
    await user.click(within(dialog).getByRole('button', { name: /guardar cliente/i }))

    await waitFor(() => expect(actualizarCliente).toHaveBeenCalledWith(10, {
      grupoId: 1,
      nombre: 'Ana María Pérez',
      tipoDocumento: 'CC',
      documento: '1020304050',
      email: 'ana@correo.com',
      telefono: '3001234567',
      unidad: 'Apto 101',
      activo: true,
    }))
    expect(await screen.findByText('Cliente actualizado correctamente')).toBeInTheDocument()
  })

  it('muestra junto al campo los errores de validación (400) del servidor', async () => {
    const user = userEvent.setup()
    crearCliente.mockRejectedValue(new ApiError(400, {
      title: 'Datos inválidos',
      errores: { documento: 'El documento solo admite letras, dígitos, puntos y guion', email: 'El correo no es válido' },
    }))
    renderWithProviders(<ClientesPage />)
    await screen.findByText('Ana Pérez')
    await screen.findByRole('option', { name: 'Conjunto Palmas' })

    await user.click(screen.getByRole('button', { name: /nuevo cliente/i }))
    const dialog = screen.getByRole('dialog')
    await llenarFormulario(user, dialog, { documento: '12 34' })
    await user.click(within(dialog).getByRole('button', { name: /guardar cliente/i }))

    const documento = within(dialog).getByLabelText(/^documento/i)
    await waitFor(() => expect(documento).toHaveAttribute('aria-invalid', 'true'))
    expect(within(dialog).getByText('El documento solo admite letras, dígitos, puntos y guion')).toBeInTheDocument()
    expect(within(dialog).getByText('El correo no es válido')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('muestra el conflicto (409) por unidad duplicada junto al campo unidad', async () => {
    const user = userEvent.setup()
    const detalle = "Ya existe un cliente en la unidad 'Apto 202' del grupo 'Conjunto Palmas'"
    crearCliente.mockRejectedValue(new ApiError(409, { title: 'Conflicto', detail: detalle }))
    renderWithProviders(<ClientesPage />)
    await screen.findByText('Ana Pérez')
    await screen.findByRole('option', { name: 'Conjunto Palmas' })

    await user.click(screen.getByRole('button', { name: /nuevo cliente/i }))
    const dialog = screen.getByRole('dialog')
    await llenarFormulario(user, dialog)
    await user.click(within(dialog).getByRole('button', { name: /guardar cliente/i }))

    expect(await within(dialog).findByText(detalle)).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/^unidad/i)).toHaveAttribute('aria-invalid', 'true')
  })

  it('desactiva un cliente solo tras confirmar', async () => {
    const user = userEvent.setup()
    desactivarCliente.mockResolvedValue(null)
    renderWithProviders(<ClientesPage />)
    await screen.findByText('Ana Pérez')

    await user.click(screen.getByRole('button', { name: 'Desactivar Ana Pérez' }))
    const dialog = screen.getByRole('dialog', { name: 'Desactivar cliente' })
    expect(desactivarCliente).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: /sí, desactivar/i }))

    await waitFor(() => expect(desactivarCliente).toHaveBeenCalledWith(10))
    expect(await screen.findByText('Cliente desactivado')).toBeInTheDocument()
    expect(listarClientes).toHaveBeenCalledTimes(2)
  })

  it('cancelar la confirmación no desactiva al cliente', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ClientesPage />)
    await screen.findByText('Ana Pérez')

    await user.click(screen.getByRole('button', { name: 'Desactivar Ana Pérez' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))

    expect(desactivarCliente).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('un cliente inactivo no ofrece el botón de desactivar', async () => {
    renderWithProviders(<ClientesPage />)
    await screen.findByText('Luis Gómez')
    expect(screen.getByRole('button', { name: 'Editar Luis Gómez' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desactivar Luis Gómez' })).not.toBeInTheDocument()
  })

  it('el rol CONTADOR solo ve la lista, sin botones de escritura', async () => {
    renderWithProviders(<ClientesPage />, { usuario: USUARIOS.contador })
    await screen.findByText('Ana Pérez')

    expect(screen.queryByRole('button', { name: /nuevo cliente/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^desactivar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Acciones' })).not.toBeInTheDocument()
  })
})
