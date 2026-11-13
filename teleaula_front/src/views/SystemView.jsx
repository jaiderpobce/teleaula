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
import apiClient from '../services/apiClient';

export default function SystemView() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [activeTab, setActiveTab] = useState('usuarios');

  // Estado para Usuarios
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserCreateModalOpen, setIsUserCreateModalOpen] = useState(false);
  const [isUserEditModalOpen, setIsUserEditModalOpen] = useState(false);
  const [isUserRolesModalOpen, setIsUserRolesModalOpen] = useState(false);

  // Estado para Roles RBAC
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleSearch, setRoleSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [isRoleCreateModalOpen, setIsRoleCreateModalOpen] = useState(false);
  const [isRoleEditModalOpen, setIsRoleEditModalOpen] = useState(false);
  const [isRolePermissionsModalOpen, setIsRolePermissionsModalOpen] = useState(false);

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
    fetchUsers();
    fetchRoles();
  }, []);

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (selectedUser.id === 1) {
      showError('No se puede eliminar la cuenta de Superadministrador', 'Seguridad');
      return;
    }
    if (!window.confirm(`¿Seguro que desea eliminar al usuario "${selectedUser.nombre}"?`)) return;

    const result = await apiClient.delete(`/api/users/${selectedUser.id}`);
    if (result.ok) {
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      setSelectedUser(null);
      showSuccess(result.message || 'Usuario eliminado');
    } else {
      showError(result.message, 'Fallo al eliminar usuario');
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    if (selectedRole.id === 1) {
      showError('El rol SUPERADMIN está protegido', 'Seguridad');
      return;
    }
    if (!window.confirm(`¿Seguro que desea eliminar el rol "${selectedRole.name}"?`)) return;

    const result = await apiClient.delete(`/api/roles/${selectedRole.id}`);
    if (result.ok) {
      setRoles(prev => prev.filter(r => r.id !== selectedRole.id));
      setSelectedRole(null);
      showSuccess(result.message || 'Rol eliminado');
    } else {
      showError(result.message, 'Fallo al eliminar rol');
    }
  };

  const filteredUsers = users.filter(u =>
    u.nombre?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.documento?.includes(userSearch) ||
    u.roles?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredRoles = RoleModel.filterRoles(roles, roleSearch);

  return (
    <div style={{
      maxWidth: '1440px',
      margin: '0 auto',
      padding: '24px 20px',
      minHeight: 'calc(100vh - 65px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* HEADER DE SISTEMA & SEGURIDAD */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--panel-border)',
        borderRadius: '18px',
        padding: '20px 24px',
        boxShadow: 'var(--shadow-main)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>⚙️</span>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', margin: 0, fontSize: '1.4rem', color: 'var(--text-main)' }}>
              Configuración & Seguridad RBAC
            </h2>
          </div>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            Control de acceso basado en roles, cuentas institucionales y permisos jerárquicos.
          </p>
        </div>

        {/* TABS DE SUBMÓDULOS */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('usuarios')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid ' + (activeTab === 'usuarios' ? 'var(--google-blue)' : 'var(--panel-border)'),
              background: activeTab === 'usuarios' ? '#e8f0fe' : '#ffffff',
              color: activeTab === 'usuarios' ? 'var(--google-blue)' : 'var(--text-main)',
              fontWeight: activeTab === 'usuarios' ? 800 : 600,
              cursor: 'pointer'
            }}
          >
            <span>👤</span> Usuarios y Cuentas
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '10px',
              border: '1px solid ' + (activeTab === 'roles' ? 'var(--google-blue)' : 'var(--panel-border)'),
              background: activeTab === 'roles' ? '#e8f0fe' : '#ffffff',
              color: activeTab === 'roles' ? 'var(--google-blue)' : 'var(--text-main)',
              fontWeight: activeTab === 'roles' ? 800 : 600,
              cursor: 'pointer'
            }}
          >
            <span>🔐</span> Roles y Permisos (RBAC)
          </button>
        </div>
      </div>

      {/* CONTENIDO 1: USUARIOS Y CUENTAS */}
      {activeTab === 'usuarios' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* BOTONERA DINÁMICA DE USUARIOS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsUserCreateModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--google-blue)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
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
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)',
                  background: selectedUser ? '#ffffff' : '#f1f3f4',
                  color: selectedUser ? 'var(--text-main)' : 'var(--text-dim)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: selectedUser ? 'pointer' : 'not-allowed'
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
                  borderRadius: '10px',
                  border: '1px solid ' + (selectedUser ? '#8430ce' : 'var(--panel-border)'),
                  background: selectedUser ? '#f3e8fd' : '#f1f3f4',
                  color: selectedUser ? '#8430ce' : 'var(--text-dim)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: selectedUser ? 'pointer' : 'not-allowed'
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
                  borderRadius: '10px',
                  border: '1px solid ' + (selectedUser && selectedUser.id !== 1 ? '#ea4335' : 'var(--panel-border)'),
                  background: selectedUser && selectedUser.id !== 1 ? '#fce8e6' : '#f1f3f4',
                  color: selectedUser && selectedUser.id !== 1 ? '#c5221f' : 'var(--text-dim)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: selectedUser && selectedUser.id !== 1 ? 'pointer' : 'not-allowed'
                }}
              >
                <span>🗑️</span> Eliminar
              </button>
            </div>

            {selectedUser && (
              <div style={{ fontSize: '0.82rem', background: '#e8f0fe', padding: '6px 12px', borderRadius: '8px', color: 'var(--google-blue)', fontWeight: 700 }}>
                Seleccionado: #{selectedUser.id} {selectedUser.nombre} ({selectedUser.email})
                <button onClick={() => setSelectedUser(null)} style={{ background: 'none', border: 'none', color: 'var(--google-blue)', cursor: 'pointer', marginLeft: '8px', fontWeight: 800 }}>✕</button>
              </div>
            )}
          </div>

          {/* BUSCADOR */}
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-dim)' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar usuario por nombre, documento, correo o rol..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pos-input"
              style={{ width: '100%', height: '40px', paddingLeft: '40px', borderRadius: '10px', border: '1px solid var(--panel-border)', fontSize: '0.86rem' }}
            />
          </div>

          {/* TABLA DE USUARIOS */}
          <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '14px', overflowX: 'auto', padding: '12px' }}>
            <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ width: '50px', textAlign: 'center' }}>ID</th>
                  <th style={{ width: '110px' }}>Documento</th>
                  <th>Nombre y Apellido</th>
                  <th>Correo (Login)</th>
                  <th style={{ width: '160px' }}>Rol(es) Asignados</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Estado</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Alta</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>⏳ Cargando usuarios...</td></tr>
                ) : filteredUsers.map(u => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(isSelected ? null : u)}
                      style={{ cursor: 'pointer', background: isSelected ? '#e8f0fe' : 'transparent' }}
                    >
                      <td style={{ textAlign: 'center' }} className="code-col">#{u.id}</td>
                      <td>{u.documento || '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.nombre} {u.apellido}</td>
                      <td style={{ color: 'var(--google-blue)', fontWeight: 600 }}>{u.email}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: '#e8f0fe', color: 'var(--google-blue)', fontWeight: 800, fontSize: '0.72rem' }}>
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTENIDO 2: ROLES Y PERMISOS RBAC */}
      {activeTab === 'roles' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* BOTONERA DINÁMICA DE ROLES */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setIsRoleCreateModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--google-blue)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
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
                  borderRadius: '10px',
                  border: '1px solid var(--panel-border)',
                  background: selectedRole ? '#ffffff' : '#f1f3f4',
                  color: selectedRole ? 'var(--text-main)' : 'var(--text-dim)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: selectedRole ? 'pointer' : 'not-allowed'
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
                  borderRadius: '10px',
                  border: '1px solid ' + (selectedRole ? '#8430ce' : 'var(--panel-border)'),
                  background: selectedRole ? '#f3e8fd' : '#f1f3f4',
                  color: selectedRole ? '#8430ce' : 'var(--text-dim)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: selectedRole ? 'pointer' : 'not-allowed'
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
                  borderRadius: '10px',
                  border: '1px solid ' + (selectedRole && selectedRole.id !== 1 ? '#ea4335' : 'var(--panel-border)'),
                  background: selectedRole && selectedRole.id !== 1 ? '#fce8e6' : '#f1f3f4',
                  color: selectedRole && selectedRole.id !== 1 ? '#c5221f' : 'var(--text-dim)',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: selectedRole && selectedRole.id !== 1 ? 'pointer' : 'not-allowed'
                }}
              >
                <span>🗑️</span> Eliminar
              </button>
            </div>

            {selectedRole && (
              <div style={{ fontSize: '0.82rem', background: '#e8f0fe', padding: '6px 12px', borderRadius: '8px', color: 'var(--google-blue)', fontWeight: 700 }}>
                Seleccionado: #{selectedRole.id} {selectedRole.name} ({selectedRole.modulesCount}/4 Módulos)
                <button onClick={() => setSelectedRole(null)} style={{ background: 'none', border: 'none', color: 'var(--google-blue)', cursor: 'pointer', marginLeft: '8px', fontWeight: 800 }}>✕</button>
              </div>
            )}
          </div>

          {/* BUSCADOR */}
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--text-dim)' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar rol por nombre o descripción..."
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              className="pos-input"
              style={{ width: '100%', height: '40px', paddingLeft: '40px', borderRadius: '10px', border: '1px solid var(--panel-border)', fontSize: '0.86rem' }}
            />
          </div>

          {/* TABLA DE ROLES */}
          <div style={{ background: '#ffffff', border: '1px solid var(--panel-border)', borderRadius: '14px', overflowX: 'auto', padding: '12px' }}>
            <table className="pos-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ width: '50px', textAlign: 'center' }}>ID</th>
                  <th style={{ width: '160px' }}>Rol RBAC</th>
                  <th>Descripción</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Usuarios</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Módulos Activos</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>Permisos</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rolesLoading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>⏳ Cargando roles...</td></tr>
                ) : filteredRoles.map(r => {
                  const isSelected = selectedRole?.id === r.id;
                  const roleStyle = RoleModel.getRoleBadgeStyle(r.name);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRole(isSelected ? null : r)}
                      style={{ cursor: 'pointer', background: isSelected ? '#e8f0fe' : 'transparent' }}
                    >
                      <td style={{ textAlign: 'center' }} className="code-col">#{r.id}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          ...roleStyle
                        }}>
                          {roleStyle.label}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.84rem' }}>{r.description || '—'}</td>
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALES USUARIO */}
      <UserCreateModal
        isOpen={isUserCreateModalOpen}
        onClose={() => setIsUserCreateModalOpen(false)}
        onUserCreated={() => { fetchUsers(); showSuccess('Usuario creado exitosamente'); }}
      />

      <UserEditModal
        isOpen={isUserEditModalOpen}
        onClose={() => setIsUserEditModalOpen(false)}
        user={selectedUser}
        onSave={() => { fetchUsers(); showSuccess('Usuario actualizado'); }}
      />

      <UserRolesModal
        isOpen={isUserRolesModalOpen}
        onClose={() => setIsUserRolesModalOpen(false)}
        user={selectedUser}
        onRolesUpdated={() => { fetchUsers(); showSuccess('Roles actualizados'); }}
      />

      {/* MODALES ROL */}
      <RoleCreateModal
        isOpen={isRoleCreateModalOpen}
        onClose={() => setIsRoleCreateModalOpen(false)}
        onRoleCreated={() => { fetchRoles(); showSuccess('Rol creado'); }}
      />

      <RoleEditModal
        isOpen={isRoleEditModalOpen}
        onClose={() => setIsRoleEditModalOpen(false)}
        role={selectedRole}
        onSave={() => { fetchRoles(); showSuccess('Rol actualizado'); }}
      />

      <RolePermissionsModal
        isOpen={isRolePermissionsModalOpen}
        onClose={() => setIsRolePermissionsModalOpen(false)}
        role={selectedRole}
        onPermissionsUpdated={() => { fetchRoles(); showSuccess('Matriz RBAC guardada'); }}
      />
    </div>
  );
}
