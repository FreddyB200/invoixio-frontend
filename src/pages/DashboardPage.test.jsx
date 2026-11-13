import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders, USUARIOS } from '../test/renderWithProviders.jsx'
import { formatCurrency, periodoActual } from '../utils/format.js'

vi.mock('../api/resumen.js')

import { cargarResumen } from '../api/resumen.js'
import DashboardPage from './DashboardPage.jsx'

const cliente = (id, nombre, unidad = 'Apto 101') => ({ id, nombre, documento: `${id}`, unidad, grupoId: 1, grupoNombre: 'Torre A' })

function resumenCompleto(sobre = {}) {
  return {
    clientes: { data: 52 },
    conteos: { data: { BORRADOR: 3, EMITIDA: 10, PAGADA: 30, VENCIDA: 5, total: 48 } },
    totales: { data: { facturado: 9000000, recaudado: 6500000, porCobrar: 2500000, facturasContadas: 45, truncado: false } },
    cartera: {
      data: {
        fechaCorte: '2026-11-13',
        totalAdeudado: 1800000,
        totalClientes: 2,
        totalFacturasVencidas: 3,
        top: [
          { cliente: cliente(7, 'Marta Gómez'), facturasVencidas: 2, totalAdeudado: 1200000, diasMoraMaximo: 45 },
          { cliente: cliente(8, 'Luis Pérez', 'Apto 202'), facturasVencidas: 1, totalAdeudado: 600000, diasMoraMaximo: 12 },
        ],
      },
    },
    impagas: {
      data: [
        { id: 90, numero: 'FV-0090', cliente: cliente(7, 'Marta Gómez'), estado: 'VENCIDA', fechaVencimiento: '2026-10-05', total: 300000 },
        { id: 80, numero: 'FV-0080', cliente: cliente(8, 'Luis Pérez'), estado: 'EMITIDA', fechaVencimiento: '2026-11-25', total: 150000 },
      ],
    },
    ...sobre,
  }
}

function pantalla(opciones) {
  return renderWithProviders(
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/facturas" element={<p>Ruta de facturas</p>} />
      <Route path="/cartera" element={<p>Ruta de cartera</p>} />
      <Route path="/clientes" element={<p>Ruta de clientes</p>} />
      <Route path="/empleados" element={<p>Ruta de empleados</p>} />
      <Route path="/grupos" element={<p>Ruta de grupos</p>} />
    </Routes>,
    { route: '/dashboard', ...opciones },
  )
}

beforeEach(() => {
  cargarResumen.mockReset()
  cargarResumen.mockResolvedValue(resumenCompleto())
})

describe('DashboardPage con datos', () => {
  it('pide el resumen del periodo actual y muestra los KPIs reales', async () => {
    pantalla()
    expect(await screen.findByText('52')).toBeInTheDocument()
    expect(cargarResumen).toHaveBeenCalledWith(periodoActual())
    expect(screen.getByText(formatCurrency(6500000))).toBeInTheDocument()
    expect(screen.getByText(formatCurrency(2500000))).toBeInTheDocument()
    expect(screen.getByText(formatCurrency(1800000))).toBeInTheDocument()
    expect(screen.getByText('2 clientes en mora')).toBeInTheDocument()
    expect(screen.getByText(`De ${formatCurrency(9000000)} facturado`)).toBeInTheDocument()
  })

  it('muestra las facturas del periodo por estado', async () => {
    pantalla()
    const grafico = await screen.findByRole('img', { name: /facturas del periodo por estado/i })
    expect(within(grafico).getByTitle('Pagada: 30')).toBeInTheDocument()
    expect(within(grafico).getByTitle('Vencida: 5')).toBeInTheDocument()
    expect(screen.getByText('63 %')).toBeInTheDocument()
  })

  it('lista los mayores morosos y las facturas impagas recientes', async () => {
    pantalla()
    expect(await screen.findByText('2 facturas · 45 días de mora')).toBeInTheDocument()
    expect(screen.getByText('1 factura · 12 días de mora')).toBeInTheDocument()
    expect(screen.getByText(formatCurrency(1200000))).toBeInTheDocument()
    expect(screen.getByText(/FV-0090 · Marta Gómez/)).toBeInTheDocument()
    expect(screen.getByText('Vence 05/10/2026')).toBeInTheDocument()
    expect(screen.getByText('Vencida')).toBeInTheDocument()
  })

  it('no contiene datos de demostración ni textos de inventario', async () => {
    pantalla()
    await screen.findByText('52')
    expect(screen.queryByText(/stock/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/inventario/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/IVA 19/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Comercial Andina/)).not.toBeInTheDocument()
  })
})

describe('DashboardPage con fallos parciales y estados', () => {
  it('un bloque fallido muestra su error sin tumbar a los demás', async () => {
    cargarResumen.mockResolvedValue(resumenCompleto({ cartera: { error: new Error('Cartera no disponible') } }))
    pantalla()
    expect(await screen.findByText('Cartera no disponible')).toBeInTheDocument()
    expect(screen.getByText('52')).toBeInTheDocument()
    expect(screen.getByText(formatCurrency(6500000))).toBeInTheDocument()
    expect(screen.getByText(/FV-0090 · Marta Gómez/)).toBeInTheDocument()
  })

  it('reintentar vuelve a pedir el resumen', async () => {
    cargarResumen.mockResolvedValueOnce(resumenCompleto({ impagas: { error: new Error('Falló el listado') } }))
    pantalla()
    await screen.findByText('Falló el listado')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText(/FV-0080 · Luis Pérez/)).toBeInTheDocument()
    expect(cargarResumen).toHaveBeenCalledTimes(2)
  })

  it('muestra carga mientras llega el resumen', () => {
    cargarResumen.mockReturnValue(new Promise(() => {}))
    pantalla()
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
  })

  it('muestra estados vacíos sin cartera ni facturas impagas', async () => {
    cargarResumen.mockResolvedValue(resumenCompleto({
      conteos: { data: { BORRADOR: 0, EMITIDA: 0, PAGADA: 0, VENCIDA: 0, total: 0 } },
      cartera: { data: { fechaCorte: '2026-11-13', totalAdeudado: 0, totalClientes: 0, totalFacturasVencidas: 0, top: [] } },
      impagas: { data: [] },
    }))
    pantalla()
    expect(await screen.findByText('Sin cartera vencida a la fecha.')).toBeInTheDocument()
    expect(screen.getByText('No hay facturas impagas.')).toBeInTheDocument()
    expect(screen.getByText('0 clientes en mora')).toBeInTheDocument()
  })

  it('avisa cuando el recaudo es una cifra parcial', async () => {
    cargarResumen.mockResolvedValue(resumenCompleto({
      totales: { data: { facturado: 1, recaudado: 1, porCobrar: 0, facturasContadas: 1000, truncado: true } },
    }))
    pantalla()
    expect(await screen.findByText('Parcial: primeras 1000 facturas')).toBeInTheDocument()
  })
})

describe('DashboardPage atajos y roles', () => {
  it.each([
    ['Facturar periodo', 'Ruta de facturas'],
    ['Revisar cartera', 'Ruta de cartera'],
    ['Consultar clientes', 'Ruta de clientes'],
    ['Gestionar personal', 'Ruta de empleados'],
  ])('el atajo "%s" navega', async (nombre, destino) => {
    pantalla()
    await screen.findByText('52')
    await userEvent.click(screen.getByRole('button', { name: new RegExp(nombre) }))
    expect(await screen.findByText(destino)).toBeInTheDocument()
  })

  it('"Ver cartera" del bloque de morosos navega a la cartera', async () => {
    pantalla()
    await screen.findByText('52')
    await userEvent.click(screen.getByRole('button', { name: /Ver cartera/ }))
    expect(await screen.findByText('Ruta de cartera')).toBeInTheDocument()
  })

  it('el administrador ve su nombre, su rol y el atajo de personal', async () => {
    pantalla({ usuario: USUARIOS.admin })
    await screen.findByText('52')
    expect(screen.getByText('Administrador de empresa')).toBeInTheDocument()
    expect(screen.getAllByText(USUARIOS.admin.nombre).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Gestionar personal/ })).toBeInTheDocument()
  })

  it('el contador ve todo lo de lectura pero no el atajo de personal', async () => {
    pantalla({ usuario: USUARIOS.contador })
    await screen.findByText('52')
    expect(screen.getByText('Contador · vista contable')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Gestionar personal/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ver grupos/ })).toBeInTheDocument()
    expect(screen.getByText(formatCurrency(1800000))).toBeInTheDocument()
    expect(screen.getByText(/FV-0090 · Marta Gómez/)).toBeInTheDocument()
  })

  it('el administrador general ve el nombre de la empresa activa en el titular', async () => {
    pantalla({
      usuario: USUARIOS.general,
      auth: { empresaId: 5, empresas: [{ id: 5, nombre: 'Gimnasio Central' }] },
    })
    expect(await screen.findByRole('heading', { level: 1, name: /de Gimnasio Central/ })).toBeInTheDocument()
  })
})
