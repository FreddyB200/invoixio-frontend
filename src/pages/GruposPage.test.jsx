import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GruposPage from './GruposPage.jsx'
import { renderWithProviders, USUARIOS } from '../test/renderWithProviders.jsx'
import { ApiError } from '../api/client.js'
import { listarGrupos, crearGrupo, actualizarGrupo, desactivarGrupo } from '../api/grupos.js'

vi.mock('../api/grupos.js')

const PALMAS = { id: 1, nombre: 'Conjunto Palmas', tipo: 'CONJUNTO', direccion: 'Calle 10 # 5-20', ciudad: 'Medellín', activo: true }
const NORTE = { id: 2, nombre: 'Sede Norte', tipo: 'SEDE', direccion: null, ciudad: null, activo: false }

const pagina = (content, extra = {}) => ({
  content, page: 0, size: 20, totalElements: content.length, totalPages: 1, ...extra,
})

beforeEach(() => {
  vi.resetAllMocks()
  listarGrupos.mockResolvedValue(pagina([PALMAS, NORTE]))
})

describe('GruposPage', () => {
  it('lista los grupos con su tipo y explica para qué sirven', async () => {
    renderWithProviders(<GruposPage />)

    const tabla = await screen.findByRole('table', { name: 'Lista de grupos' })
    expect(within(tabla).getByText('Conjunto Palmas')).toBeInTheDocument()
    expect(within(tabla).getByText('Conjunto')).toBeInTheDocument()
    expect(within(tabla).getByText('Sede')).toBeInTheDocument()
    expect(within(tabla).getByText('Calle 10 # 5-20')).toBeInTheDocument()
    expect(within(tabla).getByText('Inactivo')).toBeInTheDocument()
    expect(screen.getByText(/define su tarifa base/i)).toBeInTheDocument()
  })

  it('muestra el estado vacío y el error con reintento', async () => {
    const user = userEvent.setup()
    listarGrupos.mockRejectedValueOnce(new ApiError(500, { detail: 'Error interno del servidor' }))
    renderWithProviders(<GruposPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Error interno del servidor')

    listarGrupos.mockResolvedValue(pagina([]))
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Aún no hay grupos')).toBeInTheDocument()
  })

  it('filtra por estado y pagina', async () => {
    const user = userEvent.setup()
    listarGrupos.mockResolvedValue(pagina([PALMAS], { totalElements: 30, totalPages: 2 }))
    renderWithProviders(<GruposPage />)
    await screen.findByText('Conjunto Palmas')

    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'true')
    await waitFor(() => expect(listarGrupos).toHaveBeenLastCalledWith(expect.objectContaining({ activo: true, page: 0 })))

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(listarGrupos).toHaveBeenLastCalledWith(expect.objectContaining({ activo: true, page: 1 })))
  })

  it.each([
    ['SEDE', 'Sede'],
    ['PLAN', 'Plan'],
  ])('crea un grupo de tipo %s con el payload exacto', async (tipo, etiqueta) => {
    const user = userEvent.setup()
    crearGrupo.mockResolvedValue({ ...PALMAS, id: 50, tipo })
    renderWithProviders(<GruposPage />)
    await screen.findByText('Conjunto Palmas')

    await user.click(screen.getByRole('button', { name: /nuevo grupo/i }))
    const dialog = screen.getByRole('dialog', { name: 'Nuevo grupo' })
    await user.type(within(dialog).getByLabelText(/^nombre/i), `Grupo ${etiqueta}`)
    await user.selectOptions(within(dialog).getByLabelText(/^tipo/i), tipo)
    await user.type(within(dialog).getByLabelText(/^ciudad/i), 'Bogotá')
    await user.click(within(dialog).getByRole('button', { name: /guardar grupo/i }))

    await waitFor(() => expect(crearGrupo).toHaveBeenCalledWith({
      nombre: `Grupo ${etiqueta}`,
      tipo,
      direccion: null,
      ciudad: 'Bogotá',
      activo: true,
    }))
    expect(await screen.findByText('Grupo creado exitosamente')).toBeInTheDocument()
    expect(listarGrupos).toHaveBeenCalledTimes(2)
  })

  it('edita un grupo existente', async () => {
    const user = userEvent.setup()
    actualizarGrupo.mockResolvedValue(PALMAS)
    renderWithProviders(<GruposPage />)
    await screen.findByText('Conjunto Palmas')

    await user.click(screen.getByRole('button', { name: 'Editar Conjunto Palmas' }))
    const dialog = screen.getByRole('dialog', { name: 'Editar grupo' })
    expect(within(dialog).getByLabelText(/^ciudad/i)).toHaveValue('Medellín')
    const ciudad = within(dialog).getByLabelText(/^ciudad/i)
    await user.clear(ciudad)
    await user.type(ciudad, 'Envigado')
    await user.click(within(dialog).getByRole('button', { name: /guardar grupo/i }))

    await waitFor(() => expect(actualizarGrupo).toHaveBeenCalledWith(1, {
      nombre: 'Conjunto Palmas',
      tipo: 'CONJUNTO',
      direccion: 'Calle 10 # 5-20',
      ciudad: 'Envigado',
      activo: true,
    }))
  })

  it('muestra los errores del servidor junto al campo (400 y 409)', async () => {
    const user = userEvent.setup()
    renderWithProviders(<GruposPage />)
    await screen.findByText('Conjunto Palmas')

    await user.click(screen.getByRole('button', { name: /nuevo grupo/i }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/^nombre/i), 'Conjunto Palmas')

    crearGrupo.mockRejectedValueOnce(new ApiError(400, { errores: { ciudad: 'La ciudad no puede superar 100 caracteres' } }))
    await user.click(within(dialog).getByRole('button', { name: /guardar grupo/i }))
    expect(await within(dialog).findByText('La ciudad no puede superar 100 caracteres')).toBeInTheDocument()

    crearGrupo.mockRejectedValueOnce(new ApiError(409, { detail: 'Ya existe un grupo con ese nombre' }))
    await user.click(within(dialog).getByRole('button', { name: /guardar grupo/i }))
    expect(await within(dialog).findByText('Ya existe un grupo con ese nombre')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/^nombre/i)).toHaveAttribute('aria-invalid', 'true')
  })

  it('desactiva un grupo tras confirmar', async () => {
    const user = userEvent.setup()
    desactivarGrupo.mockResolvedValue(null)
    renderWithProviders(<GruposPage />)
    await screen.findByText('Conjunto Palmas')

    await user.click(screen.getByRole('button', { name: 'Desactivar Conjunto Palmas' }))
    const dialog = screen.getByRole('dialog', { name: 'Desactivar grupo' })
    expect(desactivarGrupo).not.toHaveBeenCalled()
    await user.click(within(dialog).getByRole('button', { name: /sí, desactivar/i }))

    await waitFor(() => expect(desactivarGrupo).toHaveBeenCalledWith(1))
    expect(await screen.findByText('Grupo desactivado')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Desactivar Sede Norte' })).not.toBeInTheDocument()
  })

  it('el rol CONTADOR solo ve la lista, sin botones de escritura', async () => {
    renderWithProviders(<GruposPage />, { usuario: USUARIOS.contador })
    await screen.findByText('Conjunto Palmas')

    expect(screen.queryByRole('button', { name: /nuevo grupo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^desactivar/i })).not.toBeInTheDocument()
  })
})
