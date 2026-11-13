import { useState } from 'react'
import { KPICard } from '../SharedComponents.jsx'
import { EmptyState, ErrorState, LoadingState } from '../StateViews.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { TIPOS_GRUPO, mensajeError } from '../../utils/format.js'
import { listarTodosServicios } from '../../api/servicios.js'
import { guardarTarifaGrupo, listarTarifas, listarTodosGrupos } from '../../api/tarifas.js'
import { ChipAplicacion, formatValor } from './estilos.jsx'

const clave = (grupoId, servicioId) => `${grupoId}:${servicioId}`

function aMapa(tarifas) {
  const mapa = {}
  tarifas.forEach((t) => { mapa[clave(t.grupoId, t.servicioId)] = Number(t.valor) })
  return mapa
}

function Matriz({ grupos, servicios, tarifas, puedeEscribir }) {
  const [guardadas, setGuardadas] = useState(() => aMapa(tarifas))
  const [borradores, setBorradores] = useState({})
  const [estados, setEstados] = useState({})

  const ponerEstado = (k, estado) => setEstados((s) => ({ ...s, [k]: estado }))
  const quitarBorrador = (k) => setBorradores((b) => { const { [k]: _omitido, ...resto } = b; return resto })

  const guardar = async (grupo, servicio) => {
    const k = clave(grupo.id, servicio.id)
    const borrador = borradores[k]
    if (borrador === undefined) return
    const actual = guardadas[k]
    const texto = borrador.trim().replace(',', '.')

    if (texto === '') {
      quitarBorrador(k)
      if (actual !== undefined) {
        ponerEstado(k, { error: 'No se puede quitar una tarifa existente; cámbiale el valor.' })
      }
      return
    }
    const valor = Number(texto)
    if (!Number.isFinite(valor) || valor < 0) {
      ponerEstado(k, { error: 'El valor debe ser un número mayor o igual a 0.' })
      return
    }
    if (actual === valor) {
      quitarBorrador(k)
      ponerEstado(k, undefined)
      return
    }

    ponerEstado(k, { guardando: true })
    try {
      const res = await guardarTarifaGrupo(grupo.id, servicio.id, valor)
      setGuardadas((g) => ({ ...g, [k]: Number(res?.valor ?? valor) }))
      quitarBorrador(k)
      ponerEstado(k, { ok: true })
    } catch (err) {
      ponerEstado(k, { error: mensajeError(err) })
    }
  }

  const cuotaBase = (grupo) => servicios
    .filter((s) => s.aplicacion === 'TODOS')
    .reduce((suma, s) => suma + (guardadas[clave(grupo.id, s.id)] ?? 0), 0)

  const definidas = grupos.reduce(
    (n, g) => n + servicios.filter((s) => guardadas[clave(g.id, s.id)] !== undefined).length,
    0,
  )
  const cuotas = grupos.map((g) => ({ grupo: g, valor: cuotaBase(g) }))
  const promedio = cuotas.length ? cuotas.reduce((s, c) => s + c.valor, 0) / cuotas.length : 0
  const mayor = cuotas.reduce((m, c) => (c.valor > (m?.valor ?? -1) ? c : m), null)

  return (
    <>
      <div className="kpi-grid sv-kpis">
        <KPICard label="Tarifas definidas" value={`${definidas} / ${grupos.length * servicios.length}`} num="N° 01" />
        <KPICard label="Cuota base promedio" value={formatValor(promedio)} num="N° 02" accent="moss"
          trend={{ dir: 'flat', text: 'Suma de servicios que aplican a todos' }} />
        <KPICard label="Cuota base más alta" value={formatValor(mayor?.valor)} num="N° 03" accent="oxblood"
          trend={{ dir: 'flat', text: mayor?.grupo.nombre ?? '' }} />
      </div>

      <div className="card">
        <div className="card__header">
          <div className="card__title-wrap">
            <span className="card__eyebrow">Valor base mensual</span>
            <span className="card__title">Tarifas por <em>grupo</em></span>
          </div>
          <span className="card__meta">Celda vacía = sin tarifa</span>
        </div>
        <div className="card__body sv-scroll" style={{ padding: 0 }}>
          <table className="sv-matrix" aria-label="Matriz de tarifas por grupo y servicio">
            <thead>
              <tr>
                <th scope="col">Grupo</th>
                {servicios.map((s) => (
                  <th scope="col" key={s.id}>
                    {s.nombre}
                    <small>{s.codigo} · <ChipAplicacion aplicacion={s.aplicacion} /></small>
                  </th>
                ))}
                <th scope="col" className="sv-right" title="Suma de los servicios que se facturan a todos los clientes">Cuota base</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => (
                <tr key={g.id}>
                  <th scope="row">
                    <div className="sv-name">{g.nombre}</div>
                    <div className="sv-sub">{TIPOS_GRUPO[g.tipo] ?? g.tipo}</div>
                  </th>
                  {servicios.map((s) => {
                    const k = clave(g.id, s.id)
                    const guardada = guardadas[k]
                    const estado = estados[k] ?? {}
                    return (
                      <td key={s.id} className="sv-cell">
                        {puedeEscribir ? (
                          <>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              inputMode="decimal"
                              aria-label={`Tarifa de ${s.nombre} para ${g.nombre}`}
                              aria-invalid={estado.error ? 'true' : undefined}
                              placeholder="Sin tarifa"
                              value={borradores[k] ?? (guardada !== undefined ? String(guardada) : '')}
                              onChange={(e) => {
                                setBorradores((b) => ({ ...b, [k]: e.target.value }))
                                ponerEstado(k, undefined)
                              }}
                              onBlur={() => guardar(g, s)}
                              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
                              disabled={estado.guardando}
                            />
                            <div
                              className={`sv-cell__hint ${estado.ok ? 'sv-cell__hint--ok' : ''} ${estado.error ? 'sv-cell__hint--err' : ''}`}
                              role={estado.error ? 'alert' : 'status'}
                            >
                              {estado.guardando ? 'Guardando…'
                                : estado.error ? estado.error
                                : estado.ok ? 'Guardado'
                                : guardada !== undefined ? formatValor(guardada) : ''}
                            </div>
                          </>
                        ) : (
                          <span className="sv-ro">{formatValor(guardada)}</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="sv-right sv-mono" data-testid={`cuota-${g.id}`}>{formatValor(cuotaBase(g))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default function TarifasGrupoTab() {
  const { puedeEscribirMaestros } = useAuth()
  const { data, loading, error, reload } = useAsync(
    async () => {
      const [servicios, grupos, tarifas] = await Promise.all([
        listarTodosServicios({ activo: true }),
        listarTodosGrupos({ activo: true }),
        listarTarifas(),
      ])
      return { servicios, grupos, tarifas }
    },
    [],
  )

  return (
    <section aria-label="Tarifas por grupo">
      <div className="sv-note">
        <strong>Valor base por grupo y servicio.</strong> Se factura a los clientes del grupo, salvo que tengan un valor propio
        (pestaña Overrides). {puedeEscribirMaestros
          ? 'Edita una celda y presiona Enter o sal del campo para guardarla.'
          : 'Solo lectura: tu rol no puede modificar tarifas.'}
      </div>
      {loading && !data ? <LoadingState label="Cargando tarifas…" />
        : error && !data ? <ErrorState error={error} onRetry={reload} />
        : data.grupos.length === 0 || data.servicios.length === 0 ? (
          <EmptyState
            title="No hay con qué armar la matriz"
            hint="Se necesita al menos un grupo de clientes activo y un servicio activo."
          />
        ) : (
          <Matriz
            grupos={data.grupos}
            servicios={data.servicios}
            tarifas={data.tarifas}
            puedeEscribir={puedeEscribirMaestros}
          />
        )}
    </section>
  )
}
