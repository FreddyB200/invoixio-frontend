import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, USUARIOS } from '../test/renderWithProviders.jsx'
import { ApiError } from '../api/client.js'

vi.mock('../api/empleados.js', async (importOriginal) => {
  const real = await importOriginal()
  return {
    TIPOS_DOCUMENTO: real.TIPOS_DOCUMENTO,
    listarEmpleados: vi.fn(),
    crearEmpleado: vi.fn(),
    actualizarEmpleado: vi.fn(),
    desactivarEmpleado: vi.fn(),
    listarGrupos: vi.fn(),
  }
})

import {
  listarEmpleados, crearEmpleado, actualizarEmpleado, desactivarEmpleado, listarGrupos,
} from '../api/empleados.js'
import EmpleadosPage from './EmpleadosPage.jsx'

const ana = {
  id: 1, grupoId: 3, grupoNombre: 'Torre Norte', nombre: 'Ana Torres', tipoDocumento: 'CC', documento: '1020304050',
  cargo: 'Portera', email: 'ana@correo.com', telefono: '3001234567', fechaIngreso: '2025-02-10', activo: true,
}
const luis = {
  id: 2, grupoId: null, grupoNombre: null, nombre: 'Luis Rojas', tipoDocumento: 'CE', documento: '998877',
  cargo: 'Contador', email: null, telefono: null, fechaIngreso: null, activo: false,
}
const pagina = (content, extra = {}) => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1, ...extra })
const grupos = [
  { id: 3, nombre: 'Torre Norte', activo: true },
  { id: 4, nombre: 'Torre Sur', activo: true },
  { id: 9, nombre: 'Sede cerrada', activo: false },
]

beforeEach(() => {
  vi.resetAllMocks()
  listarEmpleados.mockResolvedValue(pagina([ana, luis]))
  listarGrupos.mockResolvedValue(pagina(grupos))
})

const abrir = (opciones) => renderWithProviders(<EmpleadosPage />, { route: '/empleados', ...opciones })

async function llenarFormularioBasico(user) {
  await user.type(screen.getByLabelText('Nombre completo *'), '  Carla Ruiz ')
  await user.type(screen.getByLabelText('Documento *'), '55.123-4')
  await user.type(screen.getByLabelText('Cargo *'), 'Administradora')
}

describe('EmpleadosPage lista', () => {
  it('lista los empleados con grupo, documento y estado', async () => {
    abrir()
    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()
    expect(listarEmpleados).toHaveBeenCalledWith({ grupoId: undefined, activo: undefined, page: 0, size: 20 })
    const filaAna = screen.getByText('Ana Torres').closest('tr')
    expect(within(filaAna).getByText('Torre Norte')).toBeInTheDocument()
    expect(within(filaAna).getByText('CC 1020304050')).toBeInTheDocument()
    expect(within(filaAna).getByText('10/02/2025')).toBeInTheDocument()
    expect(within(filaAna).getByText('Activo')).toBeInTheDocument()
    const filaLuis = screen.getByText('Luis Rojas').closest('tr')
    expect(within(filaLuis).getByText('Toda la empresa')).toBeInTheDocument()
    expect(within(filaLuis).getByText('Inactivo')).toBeInTheDocument()
    expect(within(filaLuis).queryByRole('button', { name: /Desactivar/ })).not.toBeInTheDocument()
  })

  it('muestra el estado vacío', async () => {
    listarEmpleados.mockResolvedValue(pagina([]))
    abrir()
    expect(await screen.findByText('Sin empleados')).toBeInTheDocument()
  })

  it('muestra el error de carga y permite reintentar', async () => {
    listarEmpleados.mockRejectedValueOnce(new ApiError(500, { detail: 'Servidor caído' }))
    abrir()
    expect(await screen.findByText('Servidor caído')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()
  })

  it('pagina la lista', async () => {
    listarEmpleados.mockResolvedValue(pagina([ana], { totalElements: 30, totalPages: 2 }))
    abrir()
    await screen.findByText('Ana Torres')
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(listarEmpleados).toHaveBeenLastCalledWith({ grupoId: undefined, activo: undefined, page: 1, size: 20 }))
  })
})

describe('EmpleadosPage filtros', () => {
  it('filtra por grupo y por estado y vuelve a la primera página', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByText('Ana Torres')
    await user.selectOptions(screen.getByLabelText('Filtrar por grupo'), 'Torre Sur')
    await waitFor(() => expect(listarEmpleados).toHaveBeenLastCalledWith({ grupoId: 4, activo: undefined, page: 0, size: 20 }))
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'Inactivos')
    await waitFor(() => expect(listarEmpleados).toHaveBeenLastCalledWith({ grupoId: 4, activo: false, page: 0, size: 20 }))
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'Activos')
    await waitFor(() => expect(listarEmpleados).toHaveBeenLastCalledWith({ grupoId: 4, activo: true, page: 0, size: 20 }))
  })
})

describe('EmpleadosPage crear y editar', () => {
  it('crea un empleado con el payload exacto y avisa con un toast', async () => {
    const user = userEvent.setup()
    crearEmpleado.mockResolvedValue({ id: 10 })
    abrir()
    await screen.findByText('Ana Torres')
    await user.click(screen.getByRole('button', { name: /Nuevo empleado/ }))
    await llenarFormularioBasico(user)
    await user.selectOptions(screen.getByLabelText('Tipo de documento *'), 'CE')
    await user.selectOptions(screen.getByLabelText('Grupo'), 'Torre Sur')
    await user.type(screen.getByLabelText('Correo electrónico'), 'carla@correo.com')
    await user.type(screen.getByLabelText('Teléfono'), '3110000000')
    await user.type(screen.getByLabelText('Fecha de ingreso'), '2026-01-15')
    await user.click(screen.getByRole('button', { name: /Guardar empleado/ }))

    await waitFor(() => expect(crearEmpleado).toHaveBeenCalledTimes(1))
    expect(crearEmpleado).toHaveBeenCalledWith({
      grupoId: 4,
      nombre: 'Carla Ruiz',
      tipoDocumento: 'CE',
      documento: '55.123-4',
      cargo: 'Administradora',
      email: 'carla@correo.com',
      telefono: '3110000000',
      fechaIngreso: '2026-01-15',
      activo: true,
    })
    expect(await screen.findByText('Empleado registrado exitosamente')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(listarEmpleados).toHaveBeenCalledTimes(2)
  })

  it('envía null en los opcionales vacíos', async () => {
    const user = userEvent.setup()
    crearEmpleado.mockResolvedValue({ id: 11 })
    abrir()
    await screen.findByText('Ana Torres')
    await user.click(screen.getByRole('button', { name: /Nuevo empleado/ }))
    await llenarFormularioBasico(user)
    await user.click(screen.getByRole('button', { name: /Guardar empleado/ }))
    await waitFor(() => expect(crearEmpleado).toHaveBeenCalledWith({
      grupoId: null, nombre: 'Carla Ruiz', tipoDocumento: 'CC', documento: '55.123-4', cargo: 'Administradora',
      email: null, telefono: null, fechaIngreso: null, activo: true,
    }))
  })

  it('valida los obligatorios sin llamar a la API', async () => {
    const user = userEvent.setup()
    abrir()
    await screen.findByText('Ana Torres')
    await user.click(screen.getByRole('button', { name: /Nuevo empleado/ }))
    await user.click(screen.getByRole('button', { name: /Guardar empleado/ }))
    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El documento es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('El cargo es obligatorio')).toBeInTheDocument()
    expect(crearEmpleado).not.toHaveBeenCalled()
  })

  it('edita un empleado precargando sus datos', async () => {
    const user = userEvent.setup()
    actualizarEmpleado.mockResolvedValue({ ...ana, cargo: 'Coordinadora' })
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Editar Ana Torres' }))
    expect(screen.getByLabelText('Nombre completo *')).toHaveValue('Ana Torres')
    expect(screen.getByLabelText('Grupo')).toHaveValue('3')
    const cargo = screen.getByLabelText('Cargo *')
    await user.clear(cargo)
    await user.type(cargo, 'Coordinadora')
    await user.click(screen.getByRole('button', { name: /Guardar empleado/ }))
    await waitFor(() => expect(actualizarEmpleado).toHaveBeenCalledWith(1, {
      grupoId: 3, nombre: 'Ana Torres', tipoDocumento: 'CC', documento: '1020304050', cargo: 'Coordinadora',
      email: 'ana@correo.com', telefono: '3001234567', fechaIngreso: '2025-02-10', activo: true,
    }))
    expect(await screen.findByText('Empleado actualizado correctamente')).toBeInTheDocument()
  })

  it('muestra los errores de campo que devuelve el servidor', async () => {
    const user = userEvent.setup()
    crearEmpleado.mockRejectedValue(new ApiError(400, { title: 'Datos inválidos', errores: { documento: 'El documento solo admite letras y dígitos', email: 'El correo no es válido' } }))
    abrir()
    await screen.findByText('Ana Torres')
    await user.click(screen.getByRole('button', { name: /Nuevo empleado/ }))
    await llenarFormularioBasico(user)
    await user.click(screen.getByRole('button', { name: /Guardar empleado/ }))
    expect(await screen.findByText('El documento solo admite letras y dígitos')).toBeInTheDocument()
    expect(screen.getByText('El correo no es válido')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('muestra en el modal un conflicto sin campo, como documento duplicado', async () => {
    const user = userEvent.setup()
    crearEmpleado.mockRejectedValue(new ApiError(409, { detail: 'Ya existe un empleado con ese documento' }))
    abrir()
    await screen.findByText('Ana Torres')
    await user.click(screen.getByRole('button', { name: /Nuevo empleado/ }))
    await llenarFormularioBasico(user)
    await user.click(screen.getByRole('button', { name: /Guardar empleado/ }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByText('Ya existe un empleado con ese documento')).toBeInTheDocument()
  })
})

describe('EmpleadosPage desactivar', () => {
  it('pide confirmación y no desactiva si se cancela', async () => {
    const user = userEvent.setup()
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Desactivar Ana Torres' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Desactivar empleado')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(desactivarEmpleado).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('desactiva al confirmar, recarga y avisa', async () => {
    const user = userEvent.setup()
    desactivarEmpleado.mockResolvedValue(null)
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Desactivar Ana Torres' }))
    await user.click(screen.getByRole('button', { name: /Sí, desactivar/ }))
    await waitFor(() => expect(desactivarEmpleado).toHaveBeenCalledWith(1))
    expect(await screen.findByText('Empleado desactivado')).toBeInTheDocument()
    expect(listarEmpleados).toHaveBeenCalledTimes(2)
  })

  it('informa si el servidor rechaza la desactivación', async () => {
    const user = userEvent.setup()
    desactivarEmpleado.mockRejectedValue(new ApiError(404, { detail: 'El empleado ya no existe' }))
    abrir()
    await user.click(await screen.findByRole('button', { name: 'Desactivar Ana Torres' }))
    await user.click(screen.getByRole('button', { name: /Sí, desactivar/ }))
    expect(await screen.findByText('El empleado ya no existe')).toBeInTheDocument()
  })
})

describe('EmpleadosPage acceso', () => {
  it('bloquea al contador sin llamar a la API', () => {
    abrir({ usuario: USUARIOS.contador })
    expect(screen.getByText('Acceso restringido')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Nuevo empleado/ })).not.toBeInTheDocument()
    expect(listarEmpleados).not.toHaveBeenCalled()
    expect(listarGrupos).not.toHaveBeenCalled()
  })

  it('permite el acceso al administrador general', async () => {
    abrir({ usuario: USUARIOS.general })
    expect(await screen.findByText('Ana Torres')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nuevo empleado/ })).toBeInTheDocument()
  })
})
