import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { UserModel } from '../models/UserModel';
import { RoleModel } from '../models/RoleModel';
import UserCreateModal from '../components/user/UserCreateModal';
import UserEditModal from '../components/user/UserEditModal';
import UserRolesModal from '../components/user/UserRolesModal';
import RoleCreateModal from '../components/role/RoleCreateModal';
import RoleEditModal from '../components/role/RoleEditModal';
import RolePermissionsModal from '../components/role/RolePermissionsModal';
import SubmoduleIcon from '../components/common/SubmoduleIcon';
import apiClient from '../services/apiClient';

export default function SystemView() {
  const { user, getSubmodules } = useAuth();
  const { showSuccess, showError } = useNotification();
  const dbSubmodules = getSubmodules('/sistema');

  // Submódulos dinámicos leídos de teleaula_rbac.vistas (con fallback uniforme)
  const systemSubmodules = dbSubmodules.length > 0
    ? dbSubmodules.map(s => ({
        id: s.ruta.split('/').pop().replace('-logs', ''), // normaliza 'usuarios', 'roles', 'auditoria'
        label: s.nombre,
        icono: s.icono,
        desc: s.descripcion
      }))
    : [
        { id: 'usuarios', label: 'Usuarios y Cuentas', icono: 'manage_accounts', desc: 'Operadores, credenciales y estado de cuentas' },
        { id: 'roles', label: 'Roles y Permisos (RBAC)', icono: 'security', desc: 'Matriz de privilegios por módulo y vista' },
        { id: 'auditoria', label: 'Logs de Auditoría', icono: 'history', desc: 'Historial de acciones y seguridad' },
        { id: 'general', label: 'Parámetros del Sistema', icono: 'tune', desc: 'Configuración general del portal educativo' }
      ];

  const [activeTab, setActiveTab] = useState('usuarios');

  // ========================================================
  // ESTADO PARA GESTIÓN DE USUARIOS
  // ========================================================
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage, setUserItemsPerPage] = useState(10);
  const [isUserCreateModalOpen, setIsUserCreateModalOpen] = useState(false);
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [isUserRolesModalOpen, setIsUserRolesModalOpen] = useState(false);

  const fetchUsers = async () => {
    setUsersLoading(true);
    const result = await apiClient.get('/api/users');
    setUsersLoading(false);
    if (result.ok) {
      setUsers(Array.isArray(result.data) ? result.data : []);
    } else {
      showError(result.message, 'Catálogo de Usuarios');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setUserCurrentPage(1);
    setSelectedUser(null);
  }, [userSearch]);

  const filteredUsers = users.filter(u =>
    u.nombre?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.documento?.includes(userSearch) ||
    u.roles?.toLowerCase().includes(userSearch.toLowerCase())
  );
  const totalUserItems = filteredUsers.length;
  const totalUserPages = Math.max(1, Math.ceil(totalUserItems / userItemsPerPage));
  const userStartIndex = (userCurrentPage - 1) * userItemsPerPage;
  const paginatedUsers = filteredUsers.slice(userStartIndex, userStartIndex + userItemsPerPage);

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (selectedUser.id === 1) {
      showError('No se permite eliminar la cuenta del Superadministrador', 'Seguridad RBAC');
      return;
    }
    const confirmed = window.confirm(`¿Seguro que desea eliminar al usuario "${selectedUser.nombre}" (${selectedUser.email})?`);
    if (!confirmed) return;

    const result = await apiClient.delete(`/api/users/${selectedUser.id}`);
    if (result.ok) {
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setSelectedUser(null);
      showSuccess(result.message || 'Usuario eliminado con éxito');
    } else {
      showError(result.message, 'Fallo al eliminar usuario');
    }
  };

  const handleUserCreated = () => {
    fetchUsers();
    showSuccess('Usuario registrado con éxito');
  };

  const handleSaveEditedUser = () => {
    fetchUsers();
    showSuccess('Datos de usuario actualizados');
  };

  const handleRolesUpdated = () => {
    fetchUsers();
    showSuccess('Roles asignados actualizados');
  };

  // ========================================================
  // ESTADO PARA GESTIÓN DE ROLES Y PERMISOS RBAC
  // ========================================================
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleSearch, setRoleSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleCurrentPage, setRoleCurrentPage] = useState(1);
  const [roleItemsPerPage, setRoleItemsPerPage] = useState(10);
  const [isRoleCreateModalOpen, setIsRoleCreateModalOpen] = useState(false);
  const [isRoleEditModalOpen, setIsRoleEditModalOpen] = useState(false);
  const [isRolePermissionsModalOpen, setIsRolePermissionsModalOpen] = useState(false);

  const fetchRoles = async () => {
    setRolesLoading(true);
    const result = await apiClient.get('/api/roles');
    setRolesLoading(false);
    if (result.ok) {
      setRoles(Array.isArray(result.data) ? result.data : []);
    } else {
      showError(result.message, 'Catálogo de Roles');
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    setRoleCurrentPage(1);
    setSelectedRole(null);
  }, [roleSearch]);

  const filteredRoles = RoleModel.filterRoles(roles, roleSearch);
  const totalRoleItems = filteredRoles.length;
  const totalRolePages = Math.max(1, Math.ceil(totalRoleItems / roleItemsPerPage));
  const roleStartIndex = (roleCurrentPage - 1) * roleItemsPerPage;
  const paginatedRoles = filteredRoles.slice(roleStartIndex, roleStartIndex + roleItemsPerPage);

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    if (selectedRole.id === 1) {
      showError('El rol SUPERADMIN está protegido por el sistema', 'Seguridad RBAC');
      return;
    }
    const confirmed = window.confirm(`¿Seguro que desea eliminar el rol "${selectedRole.name}"?`);
    if (!confirmed) return;

    const result = await apiClient.delete(`/api/roles/${selectedRole.id}`);
    if (result.ok) {
      setRoles(prev => prev.filter(r => r.id !== selectedRole.id));
      setSelectedRole(null);
      showSuccess(result.message || `Rol "${selectedRole.name}" eliminado`);
    } else {
      showError(result.message, 'Fallo al eliminar rol');
    }
  };

  const handleRoleCreated = () => {
    fetchRoles();
    showSuccess('Rol creado con éxito');
  };

  const handleRoleUpdated = () => {
    fetchRoles();
    showSuccess('Rol actualizado correctamente');
  };

  const handlePermissionsUpdated = () => {
    fetchRoles();
    showSuccess('Matriz de privilegios guardada con éxito');
  };

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      minHeight: 'calc(100vh - 65px)',
      background: 'var(--bg-dark)',
      padding: '20px 24px',
      gap: '24px',
      maxWidth: '1500px',
      margin: '0 auto',
      width: '100%'
    }}>
      
      {/* ========================================================
          SIDEBAR LATERAL A LA IZQUIERDA (SUBMÓDULOS DE SISTEMA)
         ======================================================== */}
      <aside style={{
        width: '300px',
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '20px',
        padding: '24px 16px',
        boxShadow: 'var(--shadow-main)',
        display: 'flex',
        flexDirection: 'column',
        height: 'fit-content'
      }}>
        {/* ENCABEZADO DEL SIDEBAR */}
        <div style={{ padding: '0 10px 18px 10px', borderBottom: '1px solid var(--panel-border)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.4rem' }}>⚙️</span>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.2rem' }}>
              Módulo Sistema
            </h3>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
            Panel de control administrativo y RBAC
          </p>
        </div>

        {/* LISTA DINÁMICA DE SUBMÓDULOS */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {systemSubmodules.map((sub) => {
            const isActive = activeTab === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setActiveTab(sub.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: isActive ? '1px solid #c2e7ff' : '1px solid transparent',
                  background: isActive ? '#e8f0fe' : 'transparent',
                  color: isActive ? 'var(--google-blue)' : 'var(--text-main)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px' }}>
                  <SubmoduleIcon name={sub.icono} size={19} />
                </span>
                <div style={{ flex: 1 }}>
                  <div>{sub.label}</div>
                  <div style={{ fontSize: '0.7rem', color: isActive ? 'var(--google-blue-dark)' : 'var(--text-dim)', fontWeight: 400 }}>
                    {sub.desc}
                  </div>
                </div>
                {isActive && (
                  <span style={{ color: 'var(--google-blue)', fontSize: '0.9rem', fontWeight: 900 }}>›</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* PIE DEL SIDEBAR (ESTADO RBAC) */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--panel-border)', paddingLeft: '8px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Base de Datos de Seguridad:</div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#137333', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#137333', display: 'inline-block' }}></span>
            teleaula_rbac (MariaDB 10.11)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
            Operador activo: <strong>{user?.nombre || 'Superadmin'}</strong>
          </div>
        </div>
      </aside>

      {/* ========================================================
          PANEL PRINCIPAL CONTENEDOR SEGÚN EL SUBMÓDULO ACTIVO
         ======================================================== */}
      <main style={{
        flex: 1,
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '20px',
        padding: '28px 32px',
        boxShadow: 'var(--shadow-main)',
        minHeight: '600px'
      }}>

        {/* 1. SUBMÓDULO: USUARIOS Y CUENTAS */}
        {activeTab === 'usuarios' && (
          <div>
            {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.4rem' }}>
                  👥 Gestión de Usuarios y Cuentas (RBAC)
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
                  Registro de docentes, directores, administrativos y control de credenciales.
                </p>
              </div>

              {/* BOTONERA DINÁMICA DE USUARIOS */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setIsUserCreateModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--google-blue)',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(26, 115, 232, 0.25)'
                  }}
                >
                  <span>＋</span> Nuevo Usuario
                </button>

                <button
                  onClick={() => setIsUserEditModalOpen(true)}
                  disabled={!selectedUser}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid var(--panel-border)',
                    background: selectedUser ? '#ffffff' : '#f1f3f4',
                    color: selectedUser ? 'var(--text-main)' : '#9aa0a6',
                    cursor: selectedUser ? 'pointer' : 'not-allowed',
                    transition: 'var(--transition)'
                  }}
                >
                  <span>✏️</span> Modificar
                </button>

                <button
                  onClick={() => setIsUserRolesModalOpen(true)}
                  disabled={!selectedUser}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid ' + (selectedUser ? '#8430ce' : 'var(--panel-border)'),
                    background: selectedUser ? '#f3e8fd' : '#f1f3f4',
                    color: selectedUser ? '#8430ce' : '#9aa0a6',
                    cursor: selectedUser ? 'pointer' : 'not-allowed',
                    transition: 'var(--transition)'
                  }}
                >
                  <span>🛡️</span> Asignar Roles
                </button>

                <button
                  onClick={handleDeleteUser}
                  disabled={!selectedUser || selectedUser.id === 1}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid ' + (selectedUser && selectedUser.id !== 1 ? '#ea4335' : 'var(--panel-border)'),
                    background: selectedUser && selectedUser.id !== 1 ? '#fce8e6' : '#f1f3f4',
                    color: selectedUser && selectedUser.id !== 1 ? '#c5221f' : '#9aa0a6',
                    cursor: selectedUser && selectedUser.id !== 1 ? 'pointer' : 'not-allowed',
                    transition: 'var(--transition)'
                  }}
                >
                  <span>🗑️</span> Eliminar
                </button>
              </div>
            </div>

            {/* BARRA INFORMATIVA DE SELECCIÓN */}
            {selectedUser && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#e8f0fe',
                border: '1px solid #c2e7ff',
                padding: '8px 16px',
                borderRadius: '12px',
                marginBottom: '14px',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, color: 'var(--google-blue)' }}>Seleccionado:</span>
                  <span className="code-col" style={{ fontWeight: 700 }}>#{selectedUser.id}</span>
                  <span style={{ fontWeight: 700 }}>{selectedUser.nombre} {selectedUser.apellido}</span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span style={{ color: 'var(--google-blue)' }}>{selectedUser.email}</span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span>Roles: <strong>{selectedUser.roles}</strong></span>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)} 
                  style={{ background: 'none', border: 'none', color: 'var(--google-blue)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  ✕ Deseleccionar
                </button>
              </div>
            )}

            {/* BUSCADOR */}
            <div style={{ position: 'relative', width: '100%', marginBottom: '14px' }}>
              <span style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-dim)' }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar usuario por nombre, documento, correo o rol..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pos-input"
                style={{ width: '100%', height: '42px', paddingLeft: '40px', borderRadius: '12px', border: '1px solid var(--panel-border)', fontSize: '0.88rem' }}
              />
            </div>

            {/* TABLA PRINCIPAL DE USUARIOS */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
              <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ width: '50px', textAlign: 'center' }}>ID</th>
                    <th style={{ width: '110px' }}>Documento</th>
                    <th>Nombre y Apellido</th>
                    <th>Correo Institucional</th>
                    <th style={{ width: '170px' }}>Rol(es) RBAC</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Estado</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>Fecha Alta</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        ⏳ Cargando usuarios desde teleaula_rbac...
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No se encontraron usuarios registrados.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => {
                      const isSelected = selectedUser?.id === u.id;
                      return (
                        <tr
                          key={u.id}
                          onClick={() => setSelectedUser(isSelected ? null : u)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? '#e8f0fe' : 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ textAlign: 'center' }} className="code-col">#{u.id}</td>
                          <td>{u.documento || '—'}</td>
                          <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.nombre} {u.apellido}</td>
                          <td style={{ color: 'var(--google-blue)', fontWeight: 600 }}>{u.email}</td>
                          <td>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#e8f0fe', color: 'var(--google-blue)', fontWeight: 800, fontSize: '0.74rem' }}>
                              {u.roles}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: u.activo ? '#e6f4ea' : '#fce8e6', color: u.activo ? '#137333' : '#c5221f', fontWeight: 700, fontSize: '0.72rem' }}>
                              {u.activo ? '● Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.fechaCreacion}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINACIÓN DE USUARIOS */}
            {!usersLoading && totalUserItems > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '8px 4px', fontSize: '0.84rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>
                  Mostrando <strong>{userStartIndex + 1}</strong> a <strong>{Math.min(userStartIndex + userItemsPerPage, totalUserItems)}</strong> de <strong>{totalUserItems}</strong> usuarios
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setUserCurrentPage(p => Math.max(1, p - 1))} disabled={userCurrentPage === 1} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Anterior</button>
                  <span style={{ padding: '4px 8px', fontWeight: 700 }}>{userCurrentPage} / {totalUserPages}</span>
                  <button onClick={() => setUserCurrentPage(p => Math.min(totalUserPages, p + 1))} disabled={userCurrentPage === totalUserPages} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Siguiente</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. SUBMÓDULO: ROLES Y PERMISOS (RBAC) */}
        {activeTab === 'roles' && (
          <div>
            {/* ENCABEZADO Y BOTONES DE ACCIÓN */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--google-blue)', margin: 0, fontSize: '1.4rem' }}>
                  🔐 Roles y Matriz de Permisos (RBAC)
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
                  Configuración de módulos accesibles, submódulos y permisos granulares.
                </p>
              </div>

              {/* BOTONERA DINÁMICA DE ROLES */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setIsRoleCreateModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--google-blue)',
                    color: '#ffffff',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(26, 115, 232, 0.25)'
                  }}
                >
                  <span>＋</span> Nuevo Rol
                </button>

                <button
                  onClick={() => setIsRoleEditModalOpen(true)}
                  disabled={!selectedRole}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid var(--panel-border)',
                    background: selectedRole ? '#ffffff' : '#f1f3f4',
                    color: selectedRole ? 'var(--text-main)' : '#9aa0a6',
                    cursor: selectedRole ? 'pointer' : 'not-allowed',
                    transition: 'var(--transition)'
                  }}
                >
                  <span>✏️</span> Modificar
                </button>

                <button
                  onClick={() => setIsRolePermissionsModalOpen(true)}
                  disabled={!selectedRole}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid ' + (selectedRole ? '#8430ce' : 'var(--panel-border)'),
                    background: selectedRole ? '#f3e8fd' : '#f1f3f4',
                    color: selectedRole ? '#8430ce' : '#9aa0a6',
                    cursor: selectedRole ? 'pointer' : 'not-allowed',
                    transition: 'var(--transition)'
                  }}
                >
                  <span>🔐</span> Permisos / Módulos
                </button>

                <button
                  onClick={handleDeleteRole}
                  disabled={!selectedRole || selectedRole.id === 1}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    border: '1px solid ' + (selectedRole && selectedRole.id !== 1 ? '#ea4335' : 'var(--panel-border)'),
                    background: selectedRole && selectedRole.id !== 1 ? '#fce8e6' : '#f1f3f4',
                    color: selectedRole && selectedRole.id !== 1 ? '#c5221f' : '#9aa0a6',
                    cursor: selectedRole && selectedRole.id !== 1 ? 'pointer' : 'not-allowed',
                    transition: 'var(--transition)'
                  }}
                >
                  <span>🗑️</span> Eliminar
                </button>
              </div>
            </div>

            {/* BARRA INFORMATIVA DE SELECCIÓN */}
            {selectedRole && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#e8f0fe',
                border: '1px solid #c2e7ff',
                padding: '8px 16px',
                borderRadius: '12px',
                marginBottom: '14px',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, color: 'var(--google-blue)' }}>Seleccionado:</span>
                  <span className="code-col" style={{ fontWeight: 700 }}>#{selectedRole.id}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    ...RoleModel.getRoleBadgeStyle(selectedRole.name)
                  }}>
                    {RoleModel.getRoleBadgeStyle(selectedRole.name).label}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span>{selectedRole.description || 'Sin descripción'}</span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span>Módulos: <strong style={{ color: '#137333' }}>{selectedRole.modulesCount || 0}/4</strong></span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span>Permisos: <strong style={{ color: '#8430ce' }}>{selectedRole.permissionsCount || 0}</strong></span>
                </div>
                <button 
                  onClick={() => setSelectedRole(null)} 
                  style={{ background: 'none', border: 'none', color: 'var(--google-blue)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  ✕ Deseleccionar
                </button>
              </div>
            )}

            {/* BUSCADOR */}
            <div style={{ position: 'relative', width: '100%', marginBottom: '14px' }}>
              <span style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-dim)' }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar rol por nombre o descripción..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="pos-input"
                style={{ width: '100%', height: '42px', paddingLeft: '40px', borderRadius: '12px', border: '1px solid var(--panel-border)', fontSize: '0.88rem' }}
              />
            </div>

            {/* TABLA PRINCIPAL DE ROLES */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--panel-border)', borderRadius: '14px' }}>
              <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ width: '50px', textAlign: 'center' }}>ID</th>
                    <th style={{ width: '170px' }}>Rol RBAC</th>
                    <th>Descripción y Alcance</th>
                    <th style={{ width: '110px', textAlign: 'center' }}>Usuarios</th>
                    <th style={{ width: '140px', textAlign: 'center' }}>Módulos Activos</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Permisos</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rolesLoading ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        ⏳ Cargando catálogo de roles desde teleaula_rbac...
                      </td>
                    </tr>
                  ) : paginatedRoles.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No se encontraron roles registrados.
                      </td>
                    </tr>
                  ) : (
                    paginatedRoles.map((r) => {
                      const isSelected = selectedRole?.id === r.id;
                      const roleStyle = RoleModel.getRoleBadgeStyle(r.name);
                      return (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedRole(isSelected ? null : r)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? '#e8f0fe' : 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ textAlign: 'center' }} className="code-col">#{r.id}</td>
                          <td>
                            <span style={{
                              padding: '3px 9px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: 800,
                              ...roleStyle
                            }}>
                              {roleStyle.label}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.86rem', color: 'var(--text-main)' }}>{r.description || '—'}</td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--google-blue)' }}>{r.usersCount || 0}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: r.modulesCount > 0 ? '#e6f4ea' : '#f1f3f4', color: r.modulesCount > 0 ? '#137333' : '#5f6368', fontWeight: 700, fontSize: '0.74rem' }}>
                              {r.modulesCount} / 4 Módulos
                            </span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 800, color: '#8430ce' }}>{r.permissionsCount || 0}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#e6f4ea', color: '#137333', fontWeight: 700, fontSize: '0.72rem' }}>
                              ● Activo
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINACIÓN DE ROLES */}
            {!rolesLoading && totalRoleItems > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '8px 4px', fontSize: '0.84rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>
                  Mostrando <strong>{roleStartIndex + 1}</strong> a <strong>{Math.min(roleStartIndex + roleItemsPerPage, totalRoleItems)}</strong> de <strong>{totalRoleItems}</strong> roles
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setRoleCurrentPage(p => Math.max(1, p - 1))} disabled={roleCurrentPage === 1} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Anterior</button>
                  <span style={{ padding: '4px 8px', fontWeight: 700 }}>{roleCurrentPage} / {totalRolePages}</span>
                  <button onClick={() => setRoleCurrentPage(p => Math.min(totalRolePages, p + 1))} disabled={roleCurrentPage === totalRolePages} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>Siguiente</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. SUBMÓDULO: LOGS DE AUDITORÍA */}
        {activeTab === 'auditoria' && (
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: '0 0 6px 0', fontSize: '1.4rem' }}>
              📜 Registro de Auditoría & Trazabilidad
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Monitoreo en tiempo real de operaciones de inicio de sesión, cambios de roles y creación de actividades.
            </p>
            <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '24px', background: '#f8f9fa', textAlign: 'center', color: 'var(--text-muted)' }}>
              <span>🛡️ Módulo de registro de eventos activo en tabla <code>teleaula_rbac.auditoria_logs</code>.</span>
            </div>
          </div>
        )}

        {/* 4. SUBMÓDULO: PARÁMETROS GENERALES */}
        {activeTab === 'general' && (
          <div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-main)', margin: '0 0 6px 0', fontSize: '1.4rem' }}>
              ⚙️ Parámetros Generales de Teleaula
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Identidad escolar, período lectivo activo y políticas de aula virtual.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Período Escolar Activo
                </label>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--google-blue)' }}>Año Escolar 2026-2027</div>
              </div>
              <div style={{ border: '1px solid var(--panel-border)', borderRadius: '14px', padding: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Escala de Calificación
                </label>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--google-green)' }}>Vigesimal (0 a 20 Puntos)</div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODALES USUARIO */}
      <UserCreateModal
        isOpen={isUserCreateModalOpen}
        onClose={() => setIsUserCreateModalOpen(false)}
        onUserCreated={handleUserCreated}
      />

      <UserEditModal
        isOpen={isUserEditModalOpen}
        onClose={() => setIsUserEditModalOpen(false)}
        user={selectedUser}
        onSave={handleSaveEditedUser}
      />

      <UserRolesModal
        isOpen={isUserRolesModalOpen}
        onClose={() => setIsUserRolesModalOpen(false)}
        user={selectedUser}
        onRolesUpdated={handleRolesUpdated}
      />

      {/* MODALES ROL */}
      <RoleCreateModal
        isOpen={isRoleCreateModalOpen}
        onClose={() => setIsRoleCreateModalOpen(false)}
        onRoleCreated={handleRoleCreated}
      />

      <RoleEditModal
        isOpen={isRoleEditModalOpen}
        onClose={() => setIsRoleEditModalOpen(false)}
        role={selectedRole}
        onSave={handleRoleUpdated}
      />

      <RolePermissionsModal
        isOpen={isRolePermissionsModalOpen}
        onClose={() => setIsRolePermissionsModalOpen(false)}
        role={selectedRole}
        onPermissionsUpdated={handlePermissionsUpdated}
      />
    </div>
  );
}
