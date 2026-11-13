import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import { EmptyState } from '../components/StateViews.jsx'

// Pantalla en construccion: la reemplaza el agente de su modulo.
export default function GruposPage() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Grupos de clientes" eyebrow="Módulo V · Agrupaciones" />
        <EmptyState title="Grupos de clientes" hint="Próximamente" />
      </div>
    </div>
  )
}
