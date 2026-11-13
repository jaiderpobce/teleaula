export class RoleModel {
  /**
   * Filtra los roles por texto de búsqueda (nombre o descripción)
   */
  static filterRoles(roles, query) {
    if (!query) return roles;
    const q = query.toLowerCase().trim();
    return roles.filter(r =>
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  }

  /**
   * Devuelve estilos uniformes de badge según el rol
   */
  static getRoleBadgeStyle(roleName) {
    const r = (roleName || '').toUpperCase();
    switch (r) {
      case 'SUPERADMIN':
        return {
          background: '#fce8e6',
          color: '#c5221f',
          border: '1px solid #fad2cf',
          label: '👑 SUPERADMIN'
        };
      case 'DIRECTOR':
        return {
          background: '#e8f0fe',
          color: 'var(--google-blue)',
          border: '1px solid #c2e7ff',
          label: '💼 DIRECTOR'
        };
      case 'PROFESOR':
        return {
          background: '#e6f4ea',
          color: 'var(--google-green)',
          border: '1px solid #ceead6',
          label: '👨‍🏫 PROFESOR'
        };
      case 'ESTUDIANTE':
        return {
          background: '#fef7e0',
          color: '#b06000',
          border: '1px solid #f9ab00',
          label: '🎓 ESTUDIANTE'
        };
      case 'ADMINISTRATIVO':
        return {
          background: '#f3e8fd',
          color: '#8430ce',
          border: '1px solid #d2a4f9',
          label: '📋 ADMINISTRATIVO'
        };
      default:
        return {
          background: '#f1f3f4',
          color: '#3c4043',
          border: '1px solid #dadce0',
          label: roleName || 'ROL GENERAL'
        };
    }
  }
}

export default RoleModel;
