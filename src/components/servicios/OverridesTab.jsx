import { useEffect, useState } from 'react'
import Icon from '../Icon.jsx'
import { Modal, StatusChip } from '../SharedComponents.jsx'
import { EmptyState, ErrorState, LoadingState } from '../StateViews.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { mensajeError } from '../../utils/format.js'
import { listarTodosServicios } from '../../api/servicios.js'
import { buscarClientes, guardarOverride, listarOverrides, listarTarifas, quitarOverride } from '../../api/tarifas.js'
import { ChipAplicacion, formatValor } from './estilos.jsx'

const ESPERA_BUSQUEDA_MS = 350

function DetalleCliente({ cliente, puedeEscribir, onNotify }) {
  const { data, loading, error, reload } = useAsync(
    async () => {
      const [overrides, servicios, base] = await Promise.all([
        listarOverrides(cliente.id),
        listarTodosServicios({ activo: true }),
        listarTarifas(cliente.grupoId),
      ])
      return { overrides, servicios, base }
    },
    [cliente.id],
  )

  const [editando, setEditando] = useState(null)
  const [valor, setValor] = useState('')
  const [errorForm, setErrorForm] = useState('')
  const [aQuitar, setAQuitar] = useState(null)
  const [ocupado, setOcupado] = useState(false)

  const abrirEditar = (fila) => {
    setEditando(fila)
    setValor(fila.override ? String(fila.override.valor) : '')
    setErrorForm('')
  }

  const guardar = async () => {
    const numero = Number(valor.trim().replace(',', '.'))
    if (valor.trim() === '' || !Number.isFinite(numero) || numero < 0) {
      setErrorForm('El valor debe ser un número mayor o igual a 0.')
      return
    }
    setOcupado(true)
    try {
      await guardarOverride(cliente.id, editando.servicioId, numero)
      onNotify(editando.override ? 'Valor propio actualizado' : 'Valor propio agregado')
      setEditando(null)
      reload()
    } catch (err) {
      setErrorForm(mensajeError(err))
    } finally {
      setOcupado(false)
    }
  }

  const quitar = async () => {
    setOcupado(true)
    try {
      await quitarOverride(cliente.id, aQuitar.servicioId)
      onNotify('Valor propio quitado')
      setAQuitar(null)
      reload()
    } catch (err) {
      setErrorForm(mensajeError(err))
    } finally {
      setOcupado(false)
    }
  }

  if (loading && !data) return <LoadingState label="Cargando tarifas del cliente…" />
  if (error && !data) return <ErrorState error={error} onRetry={reload} />

  const porServicio = new Map(data.overrides.map((o) => [o.servicioId, o]))
  const baseServicio = new Map(data.base.map((t) => [t.servicioId, t]))
  const filas = data.servicios.map((s) => ({
    servicioId: s.id,
    codigo: s.codigo,
    nombre: s.nombre,
    aplicacion: s.aplicacion,
    override: porServicio.get(s.id) ?? null,
    base: baseServicio.get(s.id)?.valor ?? null,
  }))
  data.overrides.forEach((o) => {
    if (!data.servicios.some((s) => s.id === o.servicioId)) {
      filas.push({
        servicioId: o.servicioId, codigo: o.servicioCodigo, nombre: o.servicioNombre, aplicacion: null,
        override: o, base: baseServicio.get(o.servicioId)?.valor ?? null,
      })
    }
  })

  return (
    <div className="card">
      <div className="card__header">
        <div className="card__title-wrap">
          <span className="card__eyebrow">Valores propios</span>
          <span className="card__title">Overrides de <em>{cliente.nombre}</em></span>
        </div>
        <span className="card__meta">{data.overrides.length} activo(s)</span>
      </div>
      <div className="card__body" style={{ padding: 0 }}>
        {filas.length === 0 ? (
          <EmptyState title="No hay servicios activos" hint="Crea servicios en la primera pestaña." />
        ) : (
          <table aria-label={`Servicios de ${cliente.nombre}`}>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Aplicación</th>
                <th className="sv-right">Tarifa del grupo</th>
                <th className="sv-right">Valor del cliente</th>
                {puedeEscribir && <th className="sv-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.servicioId}>
                  <td>
                    <div className="sv-name">{f.nombre}</div>
                    <div className="sv-sub">{f.codigo}</div>
                  </td>
                  <td>{f.aplicacion ? <ChipAplicacion aplicacion={f.aplicacion} /> : <StatusChip status="Inactivo" />}</td>
                  <td className="sv-right sv-mono">{formatValor(f.base)}</td>
                  <td className="sv-right sv-mono">
                    {f.override ? formatValor(f.override.valor) : <span className="sv-sub">Sin valor propio</span>}
                  </td>
                  {puedeEscribir && (
                    <td>
                      <div className="sv-actions">
                        {f.override ? (
                          <>
                            <button type="button" className="btn btn--ghost btn--sm" aria-label={`Editar valor de ${f.nombre}`}
                              onClick={() => abrirEditar(f)}>
                              <Icon name="edit" size={12} /> Editar
                            </button>
                            <button type="button" className="btn btn--ghost btn--sm" aria-label={`Quitar valor de ${f.nombre}`}
                              onClick={() => { setErrorForm(''); setAQuitar(f) }}>
                              <Icon name="trash" size={12} /> Quitar
                            </button>
                          </>
                        ) : (
                          <button type="button" className="btn btn--ghost btn--sm" aria-label={`Agregar valor para ${f.nombre}`}
                            onClick={() => abrirEditar(f)}>
                            <Icon name="plus" size={12} /> Agregar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={editando !== null}
        onClose={() => setEditando(null)}
        eyebrow={editando?.override ? 'Edición de valor propio' : 'Nuevo valor propio'}
        title={`${editando?.nombre ?? ''} para ${cliente.nombre}`}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setEditando(null)}>Cancelar</button>
            <button type="button" className="btn btn--primary" onClick={guardar} disabled={ocupado}>
              <Icon name="check" size={13} /> Guardar valor
            </button>
          </>
        }
      >
        {errorForm && <div className="sv-note sv-note--error" role="alert">{errorForm}</div>}
        {editando?.aplicacion === 'OPCIONAL' && !editando.override && (
          <div className="sv-note sv-note--warn">
            Este servicio es opcional: al guardar este valor el cliente queda suscrito y se le facturará cada mes.
          </div>
        )}
        <div className="form-group">
          <label className="form-label" htmlFor="sv-override-valor">Valor mensual (pesos)</label>
          <input
            id="sv-override-valor"
            type="number"
            min="0"
            step="any"
            className="form-input"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') guardar() }}
          />
        </div>
      </Modal>

      <Modal
        isOpen={aQuitar !== null}
        onClose={() => setAQuitar(null)}
        eyebrow="Confirmación requerida"
        title="Quitar valor propio"
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={() => setAQuitar(null)}>Cancelar</button>
            <button type="button" className="btn btn--danger" onClick={quitar} disabled={ocupado}>
              <Icon name="warning" size={13} /> Sí, quitar
            </button>
          </>
        }
      >
        {errorForm && <div className="sv-note sv-note--error" role="alert">{errorForm}</div>}
        <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
          {aQuitar?.aplicacion === 'OPCIONAL'
            ? <>Al quitar el valor de <strong>{aQuitar?.nombre}</strong> el cliente deja de estar suscrito y no se le facturará este servicio.</>
            : <>Al quitar el valor de <strong>{aQuitar?.nombre}</strong> se le cobrará la tarifa de su grupo.</>}
        </p>
      </Modal>
    </div>
  )
}

export default function OverridesTab({ onNotify }) {
  const { puedeEscribirMaestros } = useAuth()
  const [texto, setTexto] = useState('')
  const [consulta, setConsulta] = useState('')
  const [cliente, setCliente] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setConsulta(texto.trim()), ESPERA_BUSQUEDA_MS)
    return () => clearTimeout(t)
  }, [texto])

  const busqueda = useAsync(
    () => (consulta ? buscarClientes({ q: consulta, size: 10 }) : Promise.resolve(null)),
    [consulta],
  )
  const resultados = busqueda.data?.content ?? []

  return (
    <section aria-label="Overrides por cliente">
      <div className="sv-note">
        <strong>Un valor propio reemplaza la tarifa del grupo solo para este cliente.</strong>{' '}
        En los servicios opcionales es además lo que suscribe al cliente: sin valor propio no se le factura.
        {!puedeEscribirMaestros && ' Solo lectura: tu rol no puede modificar tarifas.'}
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-wrap__icon"><Icon name="search" size={14} /></span>
          <input
            type="search"
            className="search-input"
            placeholder="Buscar cliente por nombre, documento o unidad…"
            aria-label="Buscar cliente"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </div>
      </div>

      {texto.trim() !== '' && (
        busqueda.loading ? <LoadingState label="Buscando…" />
          : busqueda.error ? <ErrorState error={busqueda.error} onRetry={busqueda.reload} />
          : resultados.length === 0 && consulta === texto.trim() ? (
            <EmptyState title="Sin coincidencias" hint="Prueba con otro nombre, documento o unidad." />
          ) : resultados.length > 0 && (
            <ul className="sv-results" aria-label="Resultados de búsqueda">
              {resultados.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => { setCliente(c); setTexto(''); setConsulta('') }}>
                    <span className="sv-name">{c.nombre}</span>
                    <span className="sv-sub">{[c.unidad, c.grupoNombre, c.documento].filter(Boolean).join(' · ')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )
      )}

      {cliente ? (
        <>
          <div className="sv-note sv-client" aria-label="Cliente seleccionado">
            <span>
              <span className="sv-name">{cliente.nombre}</span>
              <span className="sv-sub">{[cliente.unidad, cliente.grupoNombre, cliente.documento].filter(Boolean).join(' · ')}</span>
            </span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCliente(null)}>Cambiar cliente</button>
          </div>
          <DetalleCliente key={cliente.id} cliente={cliente} puedeEscribir={puedeEscribirMaestros} onNotify={onNotify} />
        </>
      ) : texto.trim() === '' && (
        <EmptyState title="Elige un cliente" hint="Búscalo arriba para ver o editar sus valores propios." />
      )}
    </section>
  )
}
