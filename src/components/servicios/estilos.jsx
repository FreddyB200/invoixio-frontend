import { formatCurrency } from '../../utils/format.js'

export const APLICACION = {
  TODOS: {
    etiqueta: 'Todos',
    frase: 'Se factura a todos los clientes activos del grupo que tengan tarifa.',
  },
  OPCIONAL: {
    etiqueta: 'Opcional',
    frase: 'Solo se factura a los clientes con tarifa propia (override): ellos son los suscritos.',
  },
}

export const formatValor = (valor) => (valor == null ? '—' : formatCurrency(valor))

export function formatPorcentaje(p) {
  const n = Number(p)
  return `${n > 0 ? '+' : ''}${n.toLocaleString('es-CO', { maximumFractionDigits: 4 })} %`
}

export function ChipAplicacion({ aplicacion }) {
  const info = APLICACION[aplicacion] ?? { etiqueta: aplicacion }
  return (
    <span className={`chip chip--plain ${aplicacion === 'OPCIONAL' ? 'chip--blue' : 'chip--gray'}`}>{info.etiqueta}</span>
  )
}

const css = `
.sv-tabs { display:flex; gap:4px; border-bottom:1px solid var(--ink); margin-bottom:22px; flex-wrap:wrap; }
.sv-tab { font-family:var(--font-mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase;
  padding:11px 18px; background:transparent; border:1px solid transparent; border-bottom:none; color:var(--ink-3); cursor:pointer;
  border-radius:var(--radius) var(--radius) 0 0; }
.sv-tab:hover { color:var(--ink); }
.sv-tab[aria-selected="true"] { background:var(--surface); border-color:var(--ink); color:var(--ink); font-weight:600; margin-bottom:-1px; }
.sv-note { padding:12px 16px; border:1px solid var(--rule); border-left:3px solid var(--slate); background:var(--surface);
  font-size:13px; color:var(--ink-2); line-height:1.55; margin-bottom:18px; }
.sv-note strong { color:var(--ink); }
.sv-note--warn { border-left-color:var(--amber); background:var(--amber-wash); }
.sv-note--error { border-left-color:var(--oxblood); background:var(--oxblood-wash); color:var(--oxblood); }
.sv-name { font-family:var(--font-serif); font-size:14.5px; font-weight:500; color:var(--ink); }
.sv-sub { font-size:12px; color:var(--ink-4); margin-top:2px; }
.sv-actions { display:flex; gap:6px; justify-content:flex-end; align-items:center; }
.sv-right { text-align:right; }
.sv-mono { font-family:var(--font-mono); }
.sv-radios { display:flex; flex-direction:column; gap:8px; border:0; padding:0; margin:0 0 16px; }
.sv-radios legend { padding:0; margin-bottom:6px; }
.sv-radio { display:flex; gap:10px; align-items:flex-start; padding:10px 12px; border:1px solid var(--rule);
  border-radius:var(--radius); cursor:pointer; font-size:13px; background:var(--surface); }
.sv-radio input { margin-top:3px; }
.sv-radio--on { border-color:var(--ink); background:#fff; }
.sv-radio span span { display:block; color:var(--ink-3); font-size:12px; margin-top:2px; }
.sv-check { display:flex; gap:8px; align-items:center; font-size:13px; margin-bottom:16px; }
.sv-kpis { grid-template-columns:repeat(3,1fr); }
.sv-scroll { overflow-x:auto; }
.sv-matrix th, .sv-matrix td { vertical-align:top; }
.sv-matrix th small { display:block; font-weight:400; letter-spacing:0; text-transform:none; color:var(--ink-4); margin-top:3px; }
.sv-matrix tbody th { text-transform:none; letter-spacing:0; font-family:inherit; font-weight:400; text-align:left; }
.sv-cell { min-width:150px; }
.sv-cell input { width:100%; padding:7px 9px; border:1px solid var(--rule); border-radius:var(--radius);
  font-family:var(--font-mono); font-size:13px; background:var(--surface); text-align:right; }
.sv-cell input:focus { outline:none; border-color:var(--ink); background:#fff; }
.sv-cell input[aria-invalid="true"] { border-color:var(--oxblood); }
.sv-cell__hint { font-size:11px; margin-top:4px; min-height:14px; color:var(--ink-4); font-family:var(--font-mono); }
.sv-cell__hint--ok { color:var(--moss); }
.sv-cell__hint--err { color:var(--oxblood); }
.sv-ro { font-family:var(--font-mono); font-size:13px; }
.sv-results { list-style:none; margin:0; padding:0; border:1px solid var(--rule); background:var(--surface); }
.sv-results li + li { border-top:1px solid var(--rule-soft); }
.sv-results button { width:100%; text-align:left; padding:11px 16px; background:transparent; border:0; cursor:pointer; font:inherit; }
.sv-results button:hover { background:var(--surface-2); }
.sv-client { display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; }
.sv-steps { font-family:var(--font-mono); font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--ink-4); margin-bottom:12px; }
.sv-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.sv-result { text-align:center; padding:10px 0; }
.sv-result strong { font-family:var(--font-mono); font-size:22px; display:block; }
@media (max-width: 720px) { .sv-kpis, .sv-grid-2 { grid-template-columns:1fr; } }
`

export function ServiciosStyles() {
  return <style>{css}</style>
}
