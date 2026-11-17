import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import apiClient from '../services/apiClient';

export default function LoginView() {
  const [email, setEmail] = useState('superadmin@teleaula.edu');
  const [password, setPassword] = useState('SuperAdmin123*');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const { showSuccess } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await apiClient.post('/api/auth/login', { email, password });
      setLoading(false);

      if (result.ok) {
        login(result.data);
        showSuccess(`Bienvenido, ${result.data.user.nombre} (${result.data.user.roles?.join(', ') || 'Usuario'})`);
        navigate('/aula');
      } else {
        setErrorMsg(result.message || 'Credenciales no válidas');
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg('No se pudo conectar con el servidor backend');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(26, 115, 232, 0.08), transparent 30rem), radial-gradient(circle at 90% 80%, rgba(24, 128, 56, 0.08), transparent 30rem), #f8f9fa',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '430px',
        background: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 12px 36px rgba(60, 64, 67, 0.12), 0 4px 12px rgba(60, 64, 67, 0.08)',
        border: '1px solid var(--panel-border)',
        padding: '36px 32px'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--google-blue)',
            fontSize: '0.84rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '14px',
            padding: 0
          }}
        >
          ← Volver al Portal Institucional
        </button>

        {/* LOGO INSTITUCIONAL */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #1a73e8, #188038)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: '#fff',
            boxShadow: '0 8px 20px rgba(26, 115, 232, 0.3)',
            marginBottom: '12px'
          }}>
            🎓
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
            Teleaula
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Portal Web Educativo & Gestión Escolar
          </p>
        </div>

        {/* ALERTA DE ERROR */}
        {errorMsg && (
          <div style={{
            background: '#fce8e6',
            color: '#c5221f',
            border: '1px solid #fad2cf',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.84rem',
            fontWeight: 600,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️</span> {errorMsg}
          </div>
        )}

        {/* FORMULARIO DE INGRESO */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Correo Electrónico Institucional
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pos-input"
              placeholder="ejemplo@teleaula.edu"
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '12px',
                border: '1px solid var(--panel-border)',
                padding: '0 14px',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Contraseña de Acceso
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pos-input"
              placeholder="••••••••••••"
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '12px',
                border: '1px solid var(--panel-border)',
                padding: '0 14px',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '10px',
              height: '46px',
              borderRadius: '12px',
              border: 'none',
              background: 'var(--google-blue)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(26, 115, 232, 0.35)',
              transition: 'var(--transition)'
            }}
          >
            {loading ? (
              <span>Iniciando sesión...</span>
            ) : (
              <>
                <span>Ingresar al Portal</span> ➔
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--panel-border)', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <div>Ambiente Seguro con Autenticación RBAC Granular</div>
          <div style={{ marginTop: '4px', fontWeight: 600, color: 'var(--text-dim)' }}>v1.0.0 — MariaDB Dual (`teleaula_db` + `teleaula_rbac`)</div>
        </div>
      </div>
    </div>
  );
}
