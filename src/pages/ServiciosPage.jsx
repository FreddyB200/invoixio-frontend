import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import { EmptyState } from '../components/StateViews.jsx'

// Pantalla en construccion: la reemplaza el agente de su modulo.
export default function ServiciosPage() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Servicios y tarifas" eyebrow="Módulo VI · Catálogo y precios" />
        <EmptyState title="Servicios y tarifas" hint="Próximamente" />
      </div>
    </div>
  )
}
