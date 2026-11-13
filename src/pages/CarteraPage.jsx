import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import { EmptyState } from '../components/StateViews.jsx'

// Pantalla en construccion: la reemplaza el agente de su modulo.
export default function CarteraPage() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Cartera vencida" eyebrow="Módulo III · Cobranza" />
        <EmptyState title="Cartera vencida" hint="Próximamente" />
      </div>
    </div>
  )
}
