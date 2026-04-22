/**
 * LoginPage.jsx - Pagina de autenticacion de Invoixio
 * Maneja el formulario de login con validacion y feedback de error
 * Redirige al dashboard tras autenticacion exitosa
 *
 * Requerimiento funcional: RF-01 — Autenticacion de usuarios con roles
 * Prototipo de referencia: GA6-AA3-EV02 — Seccion 2.1 Pantalla de Acceso
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  // Estado del formulario
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  /**
   * handleSubmit - Maneja el envio del formulario de login
   * Valida campos, llama al servicio de autenticacion y redirige
   * @param {React.FormEvent} e - Evento de submit del formulario
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validacion de campos obligatorios
    if (!email.trim()) { setError('El correo electronico es obligatorio'); return }
    if (!password.trim()) { setError('La contrasena es obligatoria'); return }

    setLoading(true)

    try {
      // Simula delay de peticion al backend
      await new Promise(r => setTimeout(r, 600))
      const success = login(email, password)

      if (success) {
        navigate('/dashboard', { replace: true })
      } else {
        setError('Credenciales incorrectas. Verifica tu correo y contrasena.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--gray-50)' }}>

      {/* Panel izquierdo — identidad de marca */}
      <div style={{
        width: '50%',
        background: 'linear-gradient(145deg, #0f2057 0%, #1a3a8f 60%, #1e4fc2 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
          <div style={{
            width: '52px', height: '52px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px',
          }}>🧾</div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontSize: '28px', fontWeight: '700', color: 'white' }}>
            Invoixio
          </span>
        </div>

        {/* Tagline */}
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '28px', fontWeight: '600', color: 'white', lineHeight: '1.3', marginBottom: '16px', textAlign: 'center' }}>
          Facturacion <span style={{ color: '#60a5fa' }}>inteligente</span> para tu empresa
        </h2>

        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: '1.7', textAlign: 'center', maxWidth: '340px', marginBottom: '36px' }}>
          Gestiona clientes, emite facturas y controla tu inventario desde un solo lugar.
        </p>

        {/* Features */}
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}>
          {['Facturacion electronica en segundos',
            'Control de inventario en tiempo real',
            'Reportes automaticos de cartera',
            'Acceso desde cualquier dispositivo'
          ].map(f => (
            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.8)', fontSize: '13.5px' }}>
              <span style={{
                width: '20px', height: '20px', minWidth: '20px',
                background: '#10b981', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', color: 'white', fontWeight: '700'
              }}>✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Panel derecho — formulario */}
      <div style={{
        width: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        background: 'white',
      }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
              Bienvenido de vuelta
            </h1>
            <p style={{ color: 'var(--gray-400)', fontSize: '14px' }}>
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div role="alert" style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '13px', color: '#ef4444',
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '16px',
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Formulario de login */}
          <form onSubmit={handleSubmit} noValidate>
            {/* Campo email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Correo electronico</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>✉</span>
                <input
                  id="email"
                  type="email"
                  className={`form-input ${error && !email ? 'form-input--error' : ''}`}
                  style={{ paddingLeft: '36px' }}
                  placeholder="admin@invoixio.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  autoComplete="email"
                  required
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>
            </div>

            {/* Campo password con toggle visibilidad */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">Contrasena</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>🔒</span>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: '36px', paddingRight: '40px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  autoComplete="current-password"
                  required
                />
                {/* Toggle visibilidad de contrasena */}
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                  aria-label={showPass ? 'Ocultar contrasena' : 'Ver contrasena'}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Link de recuperacion */}
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <a href="#" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>
                ¿Olvido su contrasena?
              </a>
            </div>

            {/* Boton de submit */}
            <button
              type="submit"
              className="btn btn--primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px' }}
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Ingresar al sistema'}
            </button>
          </form>

          {/* Credenciales de demo */}
          <div style={{
            marginTop: '24px',
            background: 'var(--gray-50)',
            border: '1px solid var(--gray-200)',
            borderRadius: '10px',
            padding: '14px',
            textAlign: 'center',
            fontSize: '12.5px',
            color: 'var(--gray-500)',
          }}>
            Demo — Usuario: <strong style={{ color: 'var(--gray-900)' }}>admin@invoixio.com</strong><br/>
            Contrasena: <strong style={{ color: 'var(--gray-900)' }}>admin123</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
