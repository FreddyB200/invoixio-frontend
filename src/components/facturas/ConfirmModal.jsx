import { Modal } from '../SharedComponents.jsx'

/** Confirmación de una acción con consecuencias. `tono="danger"` pinta el botón de confirmación de peligro. */
export default function ConfirmModal({ eyebrow, title, children, confirmLabel, tono = 'primary', busy, onConfirm, onClose }) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      eyebrow={eyebrow}
      title={title}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="button" className={`btn btn--${tono}`} onClick={onConfirm} disabled={busy}>
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>{children}</div>
    </Modal>
  )
}
