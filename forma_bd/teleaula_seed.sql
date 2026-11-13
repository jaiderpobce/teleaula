-- ========================================================
-- DATOS SEMILLA INICIALES: PORTAL EDUCATIVO TELEAULA
-- ========================================================

-- --------------------------------------------------------
-- 1. SEMILLAS PARA `teleaula_db` (CATÁLOGOS BÁSICOS)
-- --------------------------------------------------------
USE `teleaula_db`;

-- Estados de Actividad y Generales
INSERT INTO `status` (`id`, `descripcion`) VALUES
(1, 'Activo'),
(2, 'Inactivo'),
(3, 'Finalizado'),
(4, 'Pendiente')
ON DUPLICATE KEY UPDATE `descripcion` = VALUES(`descripcion`);

-- Estados de Inscripción
INSERT INTO `estado_inscripcion` (`id`, `nombre_estado`) VALUES
(1, 'Inscrito Regular'),
(2, 'Condicional'),
(3, 'Retirado'),
(4, 'Graduado')
ON DUPLICATE KEY UPDATE `nombre_estado` = VALUES(`nombre_estado`);

-- Tipos de Recursos Educativos
INSERT INTO `tipo_recursos` (`id`, `descripcion_tipo`) VALUES
(1, 'Guía de Estudio (PDF)'),
(2, 'Lectura Obligatoria (PDF/DOC)'),
(3, 'Presentación (PPTX/Slides)'),
(4, 'Enlace Web / Video Externo'),
(5, 'Formato Administrativo')
ON DUPLICATE KEY UPDATE `descripcion_tipo` = VALUES(`descripcion_tipo`);

-- Período Académico Inicial
INSERT INTO `periodo` (`id`, `nombre_periodo`, `fecha_inicio`, `fecha_fin`) VALUES
(1, 'Año Escolar 2026-2027', '2026-09-15', '2027-07-15')
ON DUPLICATE KEY UPDATE `nombre_periodo` = VALUES(`nombre_periodo`);


-- --------------------------------------------------------
-- 2. SEMILLAS PARA `teleaula_rbac` (CONTROL DE ACCESO Y SUPERUSUARIO)
-- --------------------------------------------------------
USE `teleaula_rbac`;

-- Roles del Sistema Escolar
INSERT INTO `rol` (`id`, `nombre_rol`, `descripcion`) VALUES
(1, 'SUPERADMIN', 'Superusuario del sistema con acceso irrestricto y control total'),
(2, 'DIRECTOR', 'Personal directivo con control académico, matrícula y auditoría'),
(3, 'PROFESOR', 'Docente de aula: gestión de tareas, notas y recursos de clase'),
(4, 'ESTUDIANTE', 'Alumno: consulta de aula virtual, tareas, recursos y notas'),
(5, 'ADMINISTRATIVO', 'Personal de secretaría y registro escolar');

-- Módulos del Sistema Teleaula
INSERT INTO `modulo` (`id`, `nombre_modulo`, `descripcion`, `icono`, `orden`) VALUES
(1, 'Aula Virtual y Docencia', 'Gestión de actividades escolares, tareas en PDF y registro de notas', 'school', 1),
(2, 'Gestión Escolar y Matrícula', 'Alumnos, docentes, asignaturas, secciones y control de inscripciones', 'assignment_ind', 2),
(3, 'Repositorio Digital', 'Almacén centralizado de recursos didácticos y documentos institucionales', 'folder_shared', 3),
(4, 'Configuración y Seguridad', 'Administración de usuarios, roles RBAC y auditoría del sistema', 'settings', 4);

-- Submódulos / Vistas del Sistema
INSERT INTO `vistas` (`id`, `id_modulo`, `nombre_vista`, `icono`, `ruta_acceso`, `descripcion`, `orden`, `activo`) VALUES
-- MÓDULO 1: AULA VIRTUAL Y DOCENCIA
(1, 1, 'Tablero de Clases', 'school', '/aula', 'Resumen de clases asignadas y actividades', 0, 1),
(10, 1, 'Actividades y Tareas', 'task', '/aula/actividades', 'Creación y entrega de tareas con guías PDF', 1, 1),
(11, 1, 'Calificaciones y Notas', 'grade', '/aula/calificaciones', 'Registro y consulta de notas con retroalimentación', 2, 1),

-- MÓDULO 2: GESTIÓN ESCOLAR Y MATRÍCULA
(2, 2, 'Control Escolar', 'assignment_ind', '/escolar', 'Dashboard administrativo escolar', 0, 1),
(20, 2, 'Padrón de Estudiantes', 'people', '/escolar/alumnos', 'Directorio de alumnos matriculados y datos personales', 1, 1),
(21, 2, 'Directorio Docente', 'badge', '/escolar/profesores', 'Gestión de profesores y especialidades', 2, 1),
(22, 2, 'Materias y Asignaturas', 'menu_book', '/escolar/materias', 'Planes de estudio, códigos curriculares y créditos', 3, 1),
(23, 2, 'Aulas y Secciones', 'meeting_room', '/escolar/secciones', 'Grupos escolares y capacidades físicas/virtuales', 4, 1),
(24, 2, 'Carga Académica (Docente-Materia)', 'co_present', '/escolar/carga-academica', 'Asignación de profesores a secciones y materias', 5, 1),
(25, 2, 'Matrícula e Inscripciones', 'how_to_reg', '/escolar/inscripciones', 'Proceso de formalización de matrícula por período', 6, 1),

-- MÓDULO 3: REPOSITORIO DIGITAL
(3, 3, 'Biblioteca y Recursos', 'folder_shared', '/repositorio', 'Repositorio central de documentos y recursos educativos', 0, 1),
(30, 3, 'Todos los Recursos', 'folder_open', '/repositorio/todos', 'Colección completa de archivos y materiales', 1, 1),
(31, 3, 'Guías y Tareas en PDF', 'picture_as_pdf', '/repositorio/guias', 'Guías de estudio y material en PDF', 2, 1),
(32, 3, 'Lecturas y Libros', 'menu_book', '/repositorio/lecturas', 'Libros de texto y lecturas recomendadas', 3, 1),
(33, 3, 'Formatos Institucionales', 'description', '/repositorio/formatos', 'Formatos administrativos y actas de secretaría', 4, 1),

-- MÓDULO 4: CONFIGURACIÓN Y SEGURIDAD
(4, 4, 'Ajustes de Seguridad', 'settings', '/sistema', 'Dashboard de configuración y accesos', 0, 1),
(40, 4, 'Usuarios y Cuentas', 'manage_accounts', '/sistema/usuarios', 'Operadores, credenciales y estado de cuentas', 1, 1),
(41, 4, 'Roles y Permisos (RBAC)', 'security', '/sistema/roles', 'Matriz de privilegios por módulo y vista', 2, 1),
(42, 4, 'Logs de Auditoría', 'history', '/sistema/auditoria', 'Historial de acciones de usuarios y seguridad', 3, 1);

-- Permisos Granulares
INSERT INTO `permisos` (`id`, `nombre_permiso`, `descripcion`) VALUES
(1, 'ACCESO_VISTA', 'Permiso para acceder y visualizar la pantalla'),
(2, 'CREAR_ACTIVIDAD', 'Permiso para programar y asignar tareas escolares'),
(3, 'EVALUAR_ACTIVIDAD', 'Permiso para calificar y retroalimentar a los alumnos'),
(4, 'SUBIR_RECURSO', 'Permiso para subir guías, PDFs y material al repositorio'),
(5, 'ELIMINAR_RECURSO', 'Permiso para remover archivos o materiales obsoletos'),
(6, 'INSCRIBIR_ALUMNO', 'Permiso para formalizar la matrícula escolar'),
(7, 'MODIFICAR_CALIFICACION', 'Permiso especial para alterar una nota ya asentada');

-- Usuario Superadmin Inicial
-- Contraseña: SuperAdmin123* (Hash BCrypt verificado)
INSERT INTO `usuario` (`id`, `nombre`, `apellido`, `numero_documento`, `telefono`, `email`, `password_hash`, `activo`) VALUES
(1, 'Super', 'Administrador', 'V-00000000', '0412-0000000', 'superadmin@teleaula.edu', '$2b$12$8LoMvJHIWwsuDE5cKL5AouOsa7xy.5jaPBYdGJNgkQvO92rtu8/Y6', 1);

-- Asignación de Rol SUPERADMIN al usuario 1
INSERT INTO `r_usuario_rol` (`usuario_id`, `rol_id`) VALUES
(1, 1);

-- Habilitar todos los 4 módulos para SUPERADMIN
INSERT INTO `r_modulo_rol` (`id`, `rol_id`, `modulo_id`, `habilitado`) VALUES
(1, 1, 1, 1),
(2, 1, 2, 1),
(3, 1, 3, 1),
(4, 1, 4, 1);

-- Otorgar a SUPERADMIN acceso total a todas las vistas y permisos
INSERT INTO `vistas_permiso` (`r_modulo_rol_id`, `vista_id`, `permiso_id`, `permitido`)
SELECT rmr.id, v.id, p.id, 1
FROM `r_modulo_rol` rmr
JOIN `modulo` m ON m.id = rmr.modulo_id
JOIN `vistas` v ON v.id_modulo = m.id
CROSS JOIN `permisos` p
WHERE rmr.rol_id = 1;
