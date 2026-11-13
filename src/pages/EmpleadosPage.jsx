import Sidebar from '../components/Sidebar.jsx'
import Topbar from '../components/Topbar.jsx'
import { EmptyState } from '../components/StateViews.jsx'

// Pantalla en construccion: la reemplaza el agente de su modulo.
export default function EmpleadosPage() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-wrap">
        <Topbar title="Empleados" eyebrow="Módulo VII · Personal" />
        <EmptyState title="Empleados" hint="Próximamente" />
      </div>
    </div>
  )
}
