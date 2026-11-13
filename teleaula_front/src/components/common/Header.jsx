import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, logout, canAccessRoute } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <header className="topbar">
      {/* LOGO Y TÍTULO */}
      <div className="brand" onClick={() => navigate('/aula')} style={{ cursor: 'pointer' }}>
        <div className="brand-logo" style={{ background: 'linear-gradient(135deg, #1a73e8, #188038)' }}>
          🎓
        </div>
        <div className="brand-text">
          <h1>Teleaula</h1>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Portal Web Educativo & LMS</span>
        </div>
      </div>

      {/* NAVEGACIÓN PRINCIPAL ENTRE MÓDULOS */}
      <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {canAccessRoute('/aula') && (
          <NavLink
            to="/aula"
            className={({ isActive }) => `module-nav-btn ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              color: isActive ? '#ffffff' : 'var(--text-main)',
              background: isActive ? 'var(--google-blue)' : 'transparent',
              transition: 'var(--transition)'
            })}
          >
            <span>🏫</span> Aula Virtual
          </NavLink>
        )}

        {canAccessRoute('/escolar') && (
          <NavLink
            to="/escolar"
            className={({ isActive }) => `module-nav-btn ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              color: isActive ? '#ffffff' : 'var(--text-main)',
              background: isActive ? 'var(--google-blue)' : 'transparent',
              transition: 'var(--transition)'
            })}
          >
            <span>📋</span> Gestión Escolar
          </NavLink>
        )}

        {canAccessRoute('/repositorio') && (
          <NavLink
            to="/repositorio"
            className={({ isActive }) => `module-nav-btn ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              color: isActive ? '#ffffff' : 'var(--text-main)',
              background: isActive ? 'var(--google-blue)' : 'transparent',
              transition: 'var(--transition)'
            })}
          >
            <span>📂</span> Repositorio
          </NavLink>
        )}

        {canAccessRoute('/sistema') && (
          <NavLink
            to="/sistema"
            className={({ isActive }) => `module-nav-btn ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              color: isActive ? '#ffffff' : 'var(--text-main)',
              background: isActive ? 'var(--google-blue)' : 'transparent',
              transition: 'var(--transition)'
            })}
          >
            <span>⚙️</span> Sistema RBAC
          </NavLink>
        )}
      </nav>

      {/* INFORMACIÓN DEL USUARIO Y LOGOUT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-main)' }}>
            {user.nombre} {user.apellido}
          </div>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
            {user.roles?.map((r, i) => (
              <span
                key={i}
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '1px 7px',
                  borderRadius: '6px',
                  background: r === 'SUPERADMIN' ? '#fce8e6' : (r === 'PROFESOR' ? '#e6f4ea' : '#e8f0fe'),
                  color: r === 'SUPERADMIN' ? '#c5221f' : (r === 'PROFESOR' ? '#137333' : '#1a73e8')
                }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '10px',
            border: '1px solid var(--panel-border)',
            background: '#ffffff',
            color: 'var(--google-red)',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
          title="Cerrar Sesión Institucional"
        >
          <span>🚪</span> Salir
        </button>
      </div>
    </header>
  );
}
