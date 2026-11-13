import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Módulos y submódulos (vistas) por defecto de Teleaula
const DEFAULT_SUPERADMIN_MODULES = [
  { 
    id: 1, 
    nombre: 'Aula Virtual y Docencia', 
    ruta: '/aula', 
    icono: 'school',
    submodulos: [
      { id: 10, id_modulo: 1, nombre: 'Actividades y Tareas', icono: 'task', ruta: '/aula/actividades', orden: 1, descripcion: 'Creación y entrega de tareas con guías PDF' },
      { id: 11, id_modulo: 1, nombre: 'Calificaciones y Notas', icono: 'grade', ruta: '/aula/calificaciones', orden: 2, descripcion: 'Registro y consulta de notas con retroalimentación' }
    ]
  },
  { 
    id: 2, 
    nombre: 'Gestión Escolar', 
    ruta: '/escolar', 
    icono: 'assignment_ind',
    submodulos: [
      { id: 20, id_modulo: 2, nombre: 'Padrón de Estudiantes', icono: 'people', ruta: '/escolar/alumnos', orden: 1, descripcion: 'Directorio de alumnos matriculados y datos personales' },
      { id: 21, id_modulo: 2, nombre: 'Directorio Docente', icono: 'badge', ruta: '/escolar/profesores', orden: 2, descripcion: 'Gestión de profesores y especialidades' },
      { id: 22, id_modulo: 2, nombre: 'Materias y Asignaturas', icono: 'menu_book', ruta: '/escolar/materias', orden: 3, descripcion: 'Planes de estudio, códigos curriculares y créditos' },
      { id: 23, id_modulo: 2, nombre: 'Aulas y Secciones', icono: 'meeting_room', ruta: '/escolar/secciones', orden: 4, descripcion: 'Grupos escolares y capacidades físicas/virtuales' },
      { id: 24, id_modulo: 2, nombre: 'Carga Académica (RSP)', icono: 'co_present', ruta: '/escolar/carga-academica', orden: 5, descripcion: 'Asignación de profesores a secciones y materias' },
      { id: 25, id_modulo: 2, nombre: 'Matrícula e Inscripciones', icono: 'how_to_reg', ruta: '/escolar/inscripciones', orden: 6, descripcion: 'Proceso de formalización de matrícula por período' }
    ]
  },
  { 
    id: 3, 
    nombre: 'Repositorio', 
    ruta: '/repositorio', 
    icono: 'folder_shared',
    submodulos: [
      { id: 3, id_modulo: 3, nombre: 'Biblioteca de Recursos', icono: 'folder_shared', ruta: '/repositorio', orden: 1, descripcion: 'Repositorio central de documentos y recursos educativos' }
    ]
  },
  { 
    id: 4, 
    nombre: 'Sistema', 
    ruta: '/sistema', 
    icono: 'settings',
    submodulos: [
      { id: 40, id_modulo: 4, nombre: 'Usuarios y Cuentas', icono: 'manage_accounts', ruta: '/sistema/usuarios', orden: 1, descripcion: 'Operadores, credenciales y estado de cuentas' },
      { id: 41, id_modulo: 4, nombre: 'Roles y Permisos (RBAC)', icono: 'security', ruta: '/sistema/roles', orden: 2, descripcion: 'Matriz de privilegios por módulo y vista' },
      { id: 42, id_modulo: 4, nombre: 'Logs de Auditoría', icono: 'history', ruta: '/sistema/auditoria', orden: 3, descripcion: 'Historial de acciones de usuarios y seguridad' }
    ]
  }
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('teleaula_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [modules, setModules] = useState(() => {
    try {
      const saved = localStorage.getItem('teleaula_modules');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [submodules, setSubmodules] = useState(() => {
    try {
      const saved = localStorage.getItem('teleaula_submodules');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Iniciar sesión guardando los módulos y permisos
  const login = useCallback((authData) => {
    const { user: userData, modules: userModules, submodules: userSubmodules, token } = authData;

    const formattedUser = {
      id: userData.id,
      nombre: userData.nombre,
      apellido: userData.apellido || '',
      email: userData.email,
      documento: userData.documento || '',
      roles: Array.isArray(userData.roles) ? userData.roles : [userData.roles || 'ESTUDIANTE'],
      token: token || 'mock-token'
    };

    const modulesToSave = Array.isArray(userModules) && userModules.length > 0 
      ? userModules 
      : DEFAULT_SUPERADMIN_MODULES;

    const submodulesToSave = Array.isArray(userSubmodules) && userSubmodules.length > 0 
      ? userSubmodules 
      : DEFAULT_SUPERADMIN_MODULES.flatMap(m => m.submodulos || []);

    setUser(formattedUser);
    setModules(modulesToSave);
    setSubmodules(submodulesToSave);

    try {
      localStorage.setItem('teleaula_user', JSON.stringify(formattedUser));
      localStorage.setItem('teleaula_modules', JSON.stringify(modulesToSave));
      localStorage.setItem('teleaula_submodules', JSON.stringify(submodulesToSave));
    } catch (e) {
      console.warn('No se pudo guardar la sesión en localStorage:', e);
    }
  }, []);

  // Cerrar sesión
  const logout = useCallback(() => {
    setUser(null);
    setModules([]);
    setSubmodules([]);
    try {
      localStorage.removeItem('teleaula_user');
      localStorage.removeItem('teleaula_modules');
      localStorage.removeItem('teleaula_submodules');
    } catch (e) {
      console.warn('Error al limpiar sesión:', e);
    }
  }, []);

  // Obtener los submódulos autorizados de una ruta padre
  const getSubmodules = useCallback((parentRoute) => {
    if (!submodules || submodules.length === 0) {
      const fallbackMod = DEFAULT_SUPERADMIN_MODULES.find(m => m.ruta === parentRoute);
      return fallbackMod?.submodulos || [];
    }
    return submodules.filter(s => s.ruta && s.ruta.startsWith(parentRoute));
  }, [submodules]);

  // Verificar si el usuario tiene acceso a una ruta
  const canAccessRoute = useCallback((route) => {
    if (!user) return false;
    if (user.roles.includes('SUPERADMIN') || user.roles.includes('DIRECTOR')) return true;

    // Verificar en submódulos
    const inSubmodules = submodules.some(s => s.ruta === route || route.startsWith(s.ruta));
    if (inSubmodules) return true;

    // Verificar en módulos
    return modules.some(m => m.ruta === route || (m.nombre_modulo && m.nombre_modulo.toLowerCase().includes(route.replace('/', ''))));
  }, [user, submodules, modules]);

  return (
    <AuthContext.Provider value={{
      user,
      modules,
      submodules,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      getSubmodules,
      canAccessRoute
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
