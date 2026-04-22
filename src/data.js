/**
 * data.js - Datos de demostracion del sistema Invoixio
 * Simula la respuesta del backend Spring Boot / PostgreSQL
 * En produccion, estos datos se obtienen via fetch() a la API REST
 *
 * Entidades del modelo relacional:
 * - Cliente (id_cliente, razon_social, nit, email, telefono, ciudad, activo)
 * - Producto (id_producto, codigo, nombre, precio_unitario, stock, categoria)
 * - Factura (id_factura, numero_factura, fecha_emision, estado, total, cliente)
 */

export const clientes = [
  { id: 1, razonSocial: 'Comercial Andina S.A.S.', nit: '900.123.456-1', email: 'contacto@andina.com', telefono: '3001234567', ciudad: 'Bogota', activo: true, facturas: 12 },
  { id: 2, razonSocial: 'Distribuciones Norte Ltda.', nit: '860.987.321-5', email: 'ventas@norte.com.co', telefono: '3109876543', ciudad: 'Medellin', activo: true, facturas: 7 },
  { id: 3, razonSocial: 'Tech Solutions Colombia', nit: '901.456.789-2', email: 'info@techsol.co', telefono: '3204567890', ciudad: 'Cali', activo: true, facturas: 4 },
  { id: 4, razonSocial: 'Inversiones del Pacifico', nit: '890.234.567-8', email: 'admin@pacifico.com', telefono: '3156789012', ciudad: 'Buenaventura', activo: false, facturas: 2 },
  { id: 5, razonSocial: 'Grupo Empresarial Savanna', nit: '830.654.321-0', email: 'gerencia@savanna.co', telefono: '3001122334', ciudad: 'Bogota', activo: true, facturas: 19 },
]

export const productos = [
  { id: 1, codigo: 'SFT-001', nombre: 'Licencia Software Basica', precio: 850000, stock: 50, categoria: 'Software' },
  { id: 2, codigo: 'SFT-002', nombre: 'Licencia Software Pro', precio: 1950000, stock: 30, categoria: 'Software' },
  { id: 3, codigo: 'SRV-001', nombre: 'Hosting Anual Basico', precio: 480000, stock: 100, categoria: 'Servicios' },
  { id: 4, codigo: 'SRV-002', nombre: 'Soporte Tecnico (hora)', precio: 120000, stock: 200, categoria: 'Servicios' },
  { id: 5, codigo: 'HRD-001', nombre: 'Teclado Mecanico Logitech', precio: 320000, stock: 4, categoria: 'Hardware' },
  { id: 6, codigo: 'HRD-002', nombre: 'Monitor 27" Full HD', precio: 1100000, stock: 3, categoria: 'Hardware' },
]

export const facturas = [
  { id: 1, numero: 'FV-2026-0031', cliente: 'Comercial Andina S.A.S.', fecha: '2026-04-01', total: 2550000, estado: 'Pagada' },
  { id: 2, numero: 'FV-2026-0032', cliente: 'Distribuciones Norte Ltda.', fecha: '2026-04-03', total: 4800000, estado: 'Emitida' },
  { id: 3, numero: 'FV-2026-0033', cliente: 'Tech Solutions Colombia', fecha: '2026-04-05', total: 960000, estado: 'Vencida' },
  { id: 4, numero: 'FV-2026-0034', cliente: 'Grupo Empresarial Savanna', fecha: '2026-04-08', total: 7350000, estado: 'Emitida' },
]

/**
 * Formatea un numero como moneda colombiana
 * @param {number} value - Valor a formatear
 * @returns {string} Valor formateado como $ 1.234.567
 */
export const formatCurrency = (value) =>
  '$ ' + Number(value).toLocaleString('es-CO')

/**
 * Formatea una fecha ISO a formato colombiano DD/MM/YYYY
 * @param {string} date - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
