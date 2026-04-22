/**
 * LoginPage — editorial split access screen.
 * Left: ink column with serif wordmark, editorial tagline & feature ledger.
 * Right: cream paper surface with minimal form.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Icon from '../components/Icon.jsx'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) { setError('El correo electrónico es obligatorio'); return }
    if (!password.trim()) { setError('La contraseña es obligatoria'); return }

    setLoading(true)

    try {
      await new Promise(r => setTimeout(r, 600))
      const success = login(email, password)

      if (success) {
        navigate('/dashboard', { replace: true })
      } else {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
      }
    } finally {
      setLoading(false)
    }
  }

  const FEATURES = [
    { num: 'I',   text: 'Facturación electrónica con firma fiscal' },
    { num: 'II',  text: 'Catálogo e inventario con semáforo de stock' },
    { num: 'III', text: 'Cartera y conciliación de pagos en tiempo real' },
    { num: 'IV',  text: 'Reportes ejecutivos exportables en PDF' },
  ]

  return (
    <div className="login-layout">
      <style>{`
        .login-layout {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          background: var(--paper);
        }

        /* ── Left: ink column ─────────────────────────── */
        .login-ink {
          position: relative;
          background: #14110d;
          color: #e7dec7;
          padding: 56px 64px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          background-image:
            radial-gradient(700px 400px at 10% 10%, rgba(200,74,58,0.12), transparent 65%),
            radial-gradient(520px 300px at 80% 90%, rgba(60,80,50,0.14), transparent 60%),
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='1' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.9  0 0 0 0 0.85  0 0 0 0 0.72  0 0 0 0.05 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
        }

        .login-ink::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #c84a3a 0%, #c84a3a 140px, transparent 140px);
        }

        .login-ink__top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #8a7f6a;
        }

        .login-ink__mark {
          font-family: var(--font-serif);
          font-weight: 500;
          font-size: 72px;
          letter-spacing: -0.035em;
          color: #f5ecd4;
          line-height: 0.95;
          margin-top: 54px;
        }

        .login-ink__mark em {
          font-style: italic;
          font-weight: 400;
          color: #c9836b;
        }

        .login-ink__tag {
          font-family: var(--font-serif);
          font-size: 22px;
          font-weight: 400;
          line-height: 1.35;
          color: #d8cdb3;
          max-width: 480px;
          margin-top: 22px;
          letter-spacing: -0.005em;
        }

        .login-ink__tag strong {
          color: #f5ecd4;
          font-weight: 500;
        }

        .login-ink__tag em {
          font-style: italic;
          color: #e8b596;
        }

        .login-ink__rule {
          height: 1px;
          width: 80px;
          background: #c84a3a;
          margin: 40px 0 28px;
        }

        .login-ink__list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-width: 440px;
        }

        .login-ink__list-item {
          display: grid;
          grid-template-columns: 44px 1fr;
          gap: 14px;
          align-items: baseline;
          padding-bottom: 12px;
          border-bottom: 1px dashed #3a3224;
          font-size: 14px;
          color: #c8bea8;
          line-height: 1.45;
        }

        .login-ink__list-num {
          font-family: var(--font-mono);
          font-size: 10.5px;
          letter-spacing: 0.18em;
          color: #8a7f6a;
        }

        .login-ink__bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #6b6252;
          padding-top: 40px;
          border-top: 1px solid #2a241d;
        }

        /* ── Right: form column ───────────────────────── */
        .login-form-col {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 56px 64px;
          background: var(--paper);
          position: relative;
        }

        .login-form-col::before {
          content: "";
          position: absolute;
          top: 32px; right: 32px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.22em;
          color: var(--ink-4);
        }

        .login-form {
          width: 100%;
          max-width: 400px;
        }

        .login-form__eyebrow {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.26em;
          text-transform: uppercase;
          color: var(--ink-4);
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }

        .login-form__eyebrow::after {
          content: "";
          flex: 1;
          height: 1px;
          background: var(--rule);
        }

        .login-form__title {
          font-family: var(--font-serif);
          font-size: 36px;
          font-weight: 400;
          letter-spacing: -0.02em;
          line-height: 1.05;
          color: var(--ink);
          margin-bottom: 10px;
        }

        .login-form__title em {
          font-style: italic;
          color: var(--oxblood);
        }

        .login-form__sub {
          font-size: 14px;
          color: var(--ink-3);
          margin-bottom: 32px;
          max-width: 340px;
          line-height: 1.55;
        }

        .login-form__error {
          background: var(--oxblood-wash);
          border: 1px solid #d8b0a8;
          border-left-width: 3px;
          border-left-color: var(--oxblood);
          border-radius: var(--radius);
          padding: 10px 14px;
          font-size: 12.5px;
          color: var(--oxblood-2);
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .login-form__field {
          position: relative;
          margin-bottom: 16px;
        }

        .login-form__field .form-input {
          padding-left: 40px;
        }

        .login-form__field-icon {
          position: absolute;
          left: 13px;
          top: calc(50% + 14px);
          transform: translateY(-50%);
          color: var(--ink-4);
        }

        .login-form__field-toggle {
          position: absolute;
          right: 10px;
          top: calc(50% + 14px);
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--ink-4);
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .login-form__field-toggle:hover { color: var(--ink); }

        .login-form__forgot {
          text-align: right;
          margin-bottom: 24px;
        }

        .login-form__forgot a {
          font-family: var(--font-mono);
          font-size: 10.5px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-3);
          text-decoration: none;
          border-bottom: 1px solid var(--ink-5);
          padding-bottom: 2px;
          transition: color .15s, border-color .15s;
        }

        .login-form__forgot a:hover { color: var(--oxblood); border-color: var(--oxblood); }

        .login-form__submit {
          width: 100%;
          justify-content: space-between;
          padding: 14px 18px;
          font-size: 14px;
        }

        .login-form__submit-arrow { opacity: 0.7; }

        .login-form__demo {
          margin-top: 28px;
          background: var(--surface);
          border: 1px dashed var(--ink-5);
          border-radius: var(--radius);
          padding: 14px 16px;
          display: grid;
          grid-template-columns: auto 1fr;
          row-gap: 6px;
          column-gap: 16px;
          font-family: var(--font-mono);
          font-size: 11.5px;
          color: var(--ink-3);
          letter-spacing: 0.02em;
        }

        .login-form__demo-key {
          color: var(--ink-4);
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          align-self: center;
        }

        .login-form__demo-val {
          color: var(--ink);
          font-weight: 500;
        }

        .login-form__demo-head {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: var(--font-mono);
          font-size: 9.5px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--ink-4);
          padding-bottom: 8px;
          border-bottom: 1px dashed var(--ink-5);
          margin-bottom: 4px;
        }

        .login-form__demo-head::before {
          content: "§";
          color: var(--oxblood);
          font-family: var(--font-serif);
          font-size: 14px;
        }

        @media (max-width: 900px) {
          .login-layout { grid-template-columns: 1fr; }
          .login-ink { display: none; }
          .login-form-col { padding: 40px 24px; }
        }
      `}</style>

      {/* ── Left: ink editorial column ─────────────────── */}
      <section className="login-ink" aria-hidden="false">
        <div className="login-ink__top">
          <span>Vol. I · No. 1</span>
          <span>MMXXVI</span>
        </div>

        <div>
          <h1 className="login-ink__mark">Invo<em>i</em>xio</h1>
          <p className="login-ink__tag">
            La contabilidad <em>precisa</em> de una nueva generación de <strong>empresas colombianas</strong>.
          </p>
          <div className="login-ink__rule" aria-hidden="true" />
          <ul className="login-ink__list">
            {FEATURES.map(f => (
              <li key={f.num} className="login-ink__list-item">
                <span className="login-ink__list-num">— {f.num}</span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="login-ink__bottom">
          <span>SENA · Ficha 3186632</span>
          <span>Colombia · Bogotá D.C.</span>
        </div>
      </section>

      {/* ── Right: form column ─────────────────────────── */}
      <section className="login-form-col">
        <div className="login-form">
          <div className="login-form__eyebrow">
            Acceso · Sistema
          </div>
          <h2 className="login-form__title">
            Bienvenido de <em>vuelta</em>.
          </h2>
          <p className="login-form__sub">
            Ingresa tus credenciales para continuar con la gestión de facturación electrónica.
          </p>

          {error && (
            <div role="alert" className="login-form__error">
              <Icon name="warning" size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group login-form__field">
              <label className="form-label" htmlFor="email">Correo electrónico</label>
              <span className="login-form__field-icon">
                <Icon name="mail" size={15} />
              </span>
              <input
                id="email"
                type="email"
                className={`form-input ${error && !email ? 'form-input--error' : ''}`}
                placeholder="admin@invoixio.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group login-form__field">
              <label className="form-label" htmlFor="password">Contraseña</label>
              <span className="login-form__field-icon">
                <Icon name="lock" size={15} />
              </span>
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="login-form__field-toggle"
                aria-label={showPass ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                <Icon name={showPass ? 'eye-off' : 'eye'} size={15} />
              </button>
            </div>

            <div className="login-form__forgot">
              <a href="#">¿Olvidó su contraseña?</a>
            </div>

            <button
              type="submit"
              className="btn btn--primary login-form__submit"
              disabled={loading}
            >
              <span>{loading ? 'Verificando…' : 'Ingresar al sistema'}</span>
              <Icon name="arrow-up-right" size={13} className="login-form__submit-arrow" />
            </button>
          </form>

          <div className="login-form__demo">
            <div className="login-form__demo-head">Credenciales de demostración</div>
            <span className="login-form__demo-key">Usuario</span>
            <span className="login-form__demo-val">admin@invoixio.com</span>
            <span className="login-form__demo-key">Clave</span>
            <span className="login-form__demo-val">admin123</span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LoginPage
