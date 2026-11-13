import { useCallback, useState } from 'react'
import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import { Toast } from '../components/SharedComponents.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ServiciosStyles } from '../components/servicios/estilos.jsx'
import ServiciosTab from '../components/servicios/ServiciosTab.jsx'
import TarifasGrupoTab from '../components/servicios/TarifasGrupoTab.jsx'
import OverridesTab from '../components/servicios/OverridesTab.jsx'
import AjusteIpcTab from '../components/servicios/AjusteIpcTab.jsx'

const TABS = [
  { id: 'servicios', etiqueta: 'Servicios', Componente: ServiciosTab },
  { id: 'tarifas', etiqueta: 'Tarifas por grupo', Componente: TarifasGrupoTab },
  { id: 'overrides', etiqueta: 'Overrides por cliente', Componente: OverridesTab },
  { id: 'ajuste', etiqueta: 'Ajuste anual (IPC)', Componente: AjusteIpcTab },
]

export default function ServiciosPage() {
  const { puedeEscribirMaestros } = useAuth()
  const [activa, setActiva] = useState('servicios')
  const [toast, setToast] = useState(null)
  const notificar = useCallback((message, type = 'success') => setToast({ message, type }), [])
  const cerrarToast = useCallback(() => setToast(null), [])
  const { Componente } = TABS.find((t) => t.id === activa)

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Servicios y tarifas" eyebrow="Catálogo y precios" />
        <ServiciosStyles />
        <main className="page-content">
          <div className="page-header">
            <div className="page-header__left">
              <span className="page-header__eyebrow">Catálogo</span>
              <h1>Servicios y <em>tarifas</em></h1>
              <p>Define qué se cobra, cuánto vale para cada grupo de clientes y cómo se ajusta cada año.</p>
            </div>
          </div>

          {!puedeEscribirMaestros && (
            <div className="sv-note sv-note--warn" role="note">
              Modo de solo lectura: tu rol puede consultar servicios y tarifas, pero no modificarlos.
            </div>
          )}

          <div className="sv-tabs" role="tablist" aria-label="Secciones de servicios y tarifas">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`sv-tab-${t.id}`}
                aria-selected={activa === t.id}
                aria-controls="sv-panel"
                className="sv-tab"
                onClick={() => setActiva(t.id)}
              >
                {t.etiqueta}
              </button>
            ))}
          </div>

          <div id="sv-panel" role="tabpanel" aria-labelledby={`sv-tab-${activa}`}>
            <Componente key={activa} onNotify={notificar} />
          </div>
        </main>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={cerrarToast} />}
    </div>
  )
}
