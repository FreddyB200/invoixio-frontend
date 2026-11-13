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
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.status === 401
        ? 'Credenciales incorrectas. Verifica tu correo y contraseña.'
        : err.message)
    } finally {
      setLoading(false)
    }
  }

  const FEATURES = [
    { num: 'I',   text: 'Facturación en lote por periodo, con numeración consecutiva' },
    { num: 'II',  text: 'Tarifas por grupo, con ajuste anual por IPC en un clic' },
    { num: 'III', text: 'Cartera vencida por cliente y días de mora' },
    { num: 'IV',  text: 'Cada empresa ve solo sus propios datos' },
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
          background: #0f1b2d;
          color: #e6ebf1;
          padding: 56px 64px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
          background-image:
            radial-gradient(700px 400px at 10% 10%, rgba(59,116,189,0.18), transparent 65%),
            radial-gradient(520px 300px at 80% 90%, rgba(29,79,145,0.16), transparent 60%);
        }

        .login-ink::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, #3b74bd 0%, #3b74bd 140px, transparent 140px);
        }

        .login-ink__top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #8493a8;
        }

        .login-ink__mark {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 40px;
          letter-spacing: -0.035em;
          color: #f1f5fa;
          line-height: 0.95;
          margin-top: 54px;
        }

        .login-ink__mark em {
          font-style: normal;
          font-weight: 400;
          color: #7aa7e6;
        }

        .login-ink__tag {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 400;
          line-height: 1.35;
          color: #d3dbe5;
          max-width: 480px;
          margin-top: 22px;
          letter-spacing: -0.005em;
        }

        .login-ink__tag strong {
          color: #f1f5fa;
          font-weight: 500;
        }

        .login-ink__tag em {
          font-style: normal;
          color: #9ec1ee;
        }

        .login-ink__rule {
          height: 1px;
          width: 80px;
          background: #3b74bd;
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
          border-bottom: 1px dashed #2b3a52;
          font-size: 14px;
          color: #b8c3d1;
          line-height: 1.45;
        }

        .login-ink__list-num {
          font-family: var(--font-mono);
          font-size: 10.5px;
          letter-spacing: 0.06em;
          color: #8493a8;
        }

        .login-ink__bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6b7a90;
          padding-top: 40px;
          border-top: 1px solid #1f2d42;
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
          letter-spacing: 0.06em;
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
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.05;
          color: var(--ink);
          margin-bottom: 10px;
        }

        .login-form__title em {
          font-style: normal;
          color: var(--brand);
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
          border: 1px solid #f4b8b2;
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
          letter-spacing: 0.06em;
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
          letter-spacing: 0.06em;
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
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ink-4);
          padding-bottom: 8px;
          border-bottom: 1px dashed var(--ink-5);
          margin-bottom: 4px;
        }

        .login-form__demo-head::before {
          content: "";
          color: var(--oxblood);
          font-family: var(--font-display);
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
          <span>Facturación recurrente</span>
          <span>Plataforma multiempresa</span>
        </div>

        <div>
          <h1 className="login-ink__mark">Invoixio</h1>
          <p className="login-ink__tag">
            Facturación recurrente y control de cartera para <strong>empresas de servicios</strong>.
          </p>
          <div className="login-ink__rule" aria-hidden="true" />
          <ul className="login-ink__list">
            {FEATURES.map(f => (
              <li key={f.num} className="login-ink__list-item">
                <span className="login-ink__list-num" aria-hidden="true">—</span>
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
            Acceso
          </div>
          <h2 className="login-form__title">
            Bienvenido de <em>vuelta</em>.
          </h2>
          <p className="login-form__sub">
            Ingresa tus credenciales para continuar con la gestión de facturación y cartera.
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
                placeholder="correo@empresa.com"
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

          {import.meta.env.DEV && (
            <div className="login-form__demo">
              <div className="login-form__demo-head">Credenciales de demostración (solo desarrollo)</div>
              <span className="login-form__demo-key">Usuario</span>
              <span className="login-form__demo-val">admin@serviportenal.com</span>
              <span className="login-form__demo-key">Clave</span>
              <span className="login-form__demo-val">Invoixio#2026</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default LoginPage
