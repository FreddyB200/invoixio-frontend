export const pagina = (content, extra = {}) => ({
  content, page: 0, size: 20, totalElements: content.length, totalPages: 1, ...extra,
})

export const SERVICIO_ADMIN = {
  id: 10, codigo: 'ADMIN', nombre: 'Administración', descripcion: 'Cuota mensual de administración',
  aplicacion: 'TODOS', activo: true,
}
export const SERVICIO_PARQ = {
  id: 11, codigo: 'PARQ', nombre: 'Parqueadero', descripcion: null, aplicacion: 'OPCIONAL', activo: true,
}
export const SERVICIO_VIEJO = {
  id: 12, codigo: 'SALON', nombre: 'Salón comunal', descripcion: null, aplicacion: 'TODOS', activo: false,
}

export const GRUPO_NORTE = { id: 1, nombre: 'Torre Norte', tipo: 'CONJUNTO', activo: true }
export const GRUPO_SUR = { id: 2, nombre: 'Torre Sur', tipo: 'CONJUNTO', activo: true }

export const TARIFAS = [
  { id: 1, grupoId: 1, grupoNombre: 'Torre Norte', servicioId: 10, servicioCodigo: 'ADMIN', servicioNombre: 'Administración', valor: 250000 },
  { id: 2, grupoId: 1, grupoNombre: 'Torre Norte', servicioId: 11, servicioCodigo: 'PARQ', servicioNombre: 'Parqueadero', valor: 80000 },
  { id: 3, grupoId: 2, grupoNombre: 'Torre Sur', servicioId: 10, servicioCodigo: 'ADMIN', servicioNombre: 'Administración', valor: 180000 },
]

export const CLIENTE_MARIA = {
  id: 7, grupoId: 1, grupoNombre: 'Torre Norte', nombre: 'María Gómez', documento: '52123456', unidad: 'Apto 301', activo: true,
}

export const OVERRIDE_PARQ = {
  id: 5, clienteId: 7, clienteNombre: 'María Gómez', clienteUnidad: 'Apto 301',
  servicioId: 11, servicioCodigo: 'PARQ', servicioNombre: 'Parqueadero', valor: 95000,
}

export const AJUSTE_2025 = {
  id: 1, anio: 2025, porcentaje: 5.2, grupoId: null, grupoNombre: null,
  tarifasAfectadas: 12, overridesAfectados: 3, usuarioId: 2, creadoEn: '2025-02-03T15:00:00Z',
}
export const AJUSTE_GRUPO = {
  id: 2, anio: 2026, porcentaje: 3, grupoId: 2, grupoNombre: 'Torre Sur',
  tarifasAfectadas: 4, overridesAfectados: 0, usuarioId: 2, creadoEn: '2026-01-10T12:00:00Z',
}
