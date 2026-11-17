# REPÚBLICA BOLIVARIANA DE VENEZUELA
## MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN UNIVERSITARIA
### UNIVERSIDAD NACIONAL EXPERIMENTAL "RAFAEL MARÍA BARALT" (UNERMB)
#### PROGRAMA NACIONAL DE FORMACIÓN (PNF) EN INFORMÁTICA

---

# GUÍA DE INGENIERÍA DE SOFTWARE & BASES DE DATOS
## ESPECIFICACIONES TÉCNICAS, MODELADO RELACIONAL CON RBAC Y DESARROLLO DE DASHBOARDS ANALÍTICOS
### CASO DE ESTUDIO OFICIAL: PLATAFORMA INTEGRAL TELEAULA

**Autor del Instructivo:** Prof. Mg. Jaider Ponce (Ingeniero en Informática, Magíster & Docente Universitario)  
**Cátedra:** Base de Datos & Desarrollo Web — PNF en Informática UNERMB  
**Documento Oficial en PDF:** [INSTRUCTIVO_TECNICO_TELEAULA.pdf](file:///home/jaiderponce/Documentos/proyectos/teleaula/INSTRUCTIVO_TECNICO_TELEAULA.pdf)

---

## ★ PROPÓSITO TÉCNICO Y ALCANCE METODOLÓGICO

Este instructivo elaborado por el **Prof. Mg. Jaider Ponce** establece el marco metodológico para el diseño de bases de datos relacionales empresariales y académicas. Los estudiantes deben entender que el núcleo del proyecto es resolver la problemática real de la institución educativa modelando sus entidades de negocio (alumnos, docentes, materias, secciones, cargas académicas, actividades y calificaciones), mientras que el subsistema RBAC es la infraestructura transversal de seguridad que gobierna el acceso en la aplicación.

---

## SECCIÓN 1. DETERMINACIÓN DE ENTIDADES, MODELADO RELACIONAL Y NORMALIZACIÓN

El modelo E-R del proyecto **Teleaula** integra dos dimensiones complementarias: las entidades operativas del dominio escolar/académico (`teleaula_db`) y el subsistema de seguridad y privilegios jerárquicos (`teleaula_rbac`):

### 1.1 Coexistencia de Esquemas Relacionales

```
+------------------------------------------+        +------------------------------------------+
|      DOMINIO ACADÉMICO (teleaula_db)     |        |   SUBSISTEMA SEGURIDAD (teleaula_rbac)   |
+------------------------------------------+        +------------------------------------------+
|  alumno (id, cedula, nombre, correo)    |        |  usuario (id, documento, email, pass)    |
|  profesor (id, cedula, nombre, espec)   |<-------+  rol (id, nombre_rol, descripcion)       |
|  materia (id, nombre_materia)            |   |    |  modulo (id, nombre_modulo, icono)       |
|  seccion (id, nombre_seccion)            |   |    |  vistas (id, id_modulo, nombre, ruta)    |
|  r_s_p (id, id_seccion, id_prof, id_mat) |   |    |  permisos (id, nombre_permiso)           |
|  actividad (id, id_r_s_p, nombre, fecha) |   |    |  r_usuario_rol (id, usuario_id, rol_id)  |
|  recursos (id, id_actividad, ubicacion)  |   |    |  r_modulo_rol (id, rol_id, modulo_id)    |
|  notas (id, id_actividad, id_alumno, nota)   |    |  vistas_permiso (id, r_modulo_rol, vista)|
+------------------------------------------+        |  auditoria_logs (id, usuario_id, accion) |
                       ^                            +------------------------------------------+
                       |                                                 |
                       +====== Vínculo Transversal: documento = cedula =+
```

### 1.2 Reglas Metodológicas de Integridad
- **Extracción de Entidades del Negocio:** Identificación formal a partir de la realidad escolar (alumnos, docentes, materias, secciones, cargas docentes, tareas y notas).
- **El Rol Transversal del RBAC:** El subsistema RBAC no duplica datos; actúa como la gobernanza de seguridad de la aplicación (`usuario.documento = profesor.cedula / alumno.cedula` y `auditoria_logs.usuario_id ➔ usuario.id`).
- **Normalización Estricta (1FN a 3FN):**
  - **1FN:** Atomicidad de campos y ausencia de grupos repetitivos.
  - **2FN:** Dependencia funcional total respecto a la clave primaria.
  - **3FN:** Eliminación de dependencias transitivas mediante tablas catálogo maestras.
- **Convención Obligatoria de Claves:** Clave primaria denominada estrictamente `id` de tipo entero autoincremental (`INT AUTO_INCREMENT PRIMARY KEY`). Claves foráneas nombradas como `[tabla]_id` o `id_[entidad]` con integridad referencial activa.

---

## SECCIÓN 2. SUBSISTEMA OBLIGATORIO RBAC JERÁRQUICO POR MÓDULOS Y VISTAS

La seguridad del sistema reside estructurada en el motor de base de datos (`teleaula_rbac`), implementando el modelo jerárquico de 3 niveles: **Módulo ➔ Vista (Pantalla) ➔ Permiso/Acción**.

```sql
-- 1. Catálogos Base de Seguridad (Entidades Maestras con PK = id)
CREATE TABLE usuario (
  id INT AUTO_INCREMENT PRIMARY KEY, nombre VARCHAR(100) NOT NULL,
  documento VARCHAR(20) NOT NULL UNIQUE, email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL, activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE rol (
  id INT AUTO_INCREMENT PRIMARY KEY, nombre_rol VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL -- SUPERADMIN, DIRECTOR, PROFESOR, ESTUDIANTE
) ENGINE=InnoDB;

CREATE TABLE modulo (
  id INT AUTO_INCREMENT PRIMARY KEY, nombre_modulo VARCHAR(60) NOT NULL UNIQUE,
  descripcion VARCHAR(255), icono VARCHAR(50), orden INT DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE vistas (
  id INT AUTO_INCREMENT PRIMARY KEY, id_modulo INT NOT NULL,
  nombre_vista VARCHAR(80) NOT NULL, ruta_acceso VARCHAR(120) NOT NULL UNIQUE,
  icono VARCHAR(50), activo BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (id_modulo) REFERENCES modulo(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE permisos (
  id INT AUTO_INCREMENT PRIMARY KEY, nombre_permiso VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL -- LEER, CREAR, EDITAR, ELIMINAR, EVALUAR
) ENGINE=InnoDB;

-- 2. Tablas Intermedias: r_usuario_rol y r_modulo_rol (PK = id)
CREATE TABLE r_usuario_rol (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL, rol_id INT NOT NULL,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (usuario_id, rol_id),
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
  FOREIGN KEY (rol_id) REFERENCES rol(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE r_modulo_rol (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rol_id INT NOT NULL, modulo_id INT NOT NULL,
  habilitado BOOLEAN DEFAULT TRUE,
  UNIQUE (rol_id, modulo_id),
  FOREIGN KEY (rol_id) REFERENCES rol(id) ON DELETE CASCADE,
  FOREIGN KEY (modulo_id) REFERENCES modulo(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 3. Autorización Granular en vistas_permiso y Trazabilidad de Auditoría
CREATE TABLE vistas_permiso (
  id INT AUTO_INCREMENT PRIMARY KEY,
  r_modulo_rol_id INT NOT NULL REFERENCES r_modulo_rol(id) ON DELETE CASCADE,
  vista_id INT NOT NULL REFERENCES vistas(id) ON DELETE CASCADE,
  permiso_id INT NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
  permitido BOOLEAN DEFAULT TRUE, UNIQUE (r_modulo_rol_id, vista_id, permiso_id)
) ENGINE=InnoDB;

CREATE TABLE auditoria_logs (
  id INT AUTO_INCREMENT PRIMARY KEY, usuario_id INT REFERENCES usuario(id) ON DELETE SET NULL,
  accion VARCHAR(100) NOT NULL, tabla_afectada VARCHAR(60) NOT NULL,
  registro_id INT, fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
```

---

## SECCIÓN 3. PERSISTENCIA ROBUSTA, TRANSACCIONES ACID Y VISTAS

### 3.1 Transacciones Multi-Tabla ACID
Garantizan la integridad física y lógica entre el dominio académico y los registros de auditoría de seguridad:

```sql
-- 1. Transacción del Negocio: Crear actividad escolar, registrar guía PDF y asentar auditoría
START TRANSACTION;

-- Paso A: Insertar la actividad evaluativa ligada a la Carga Académica (id_r_s_p = 2)
INSERT INTO teleaula_db.actividad (id_r_s_p, nombre_actividad, fecha_entrega, puntuacion_max, id_status)
VALUES (2, 'Taller Práctico: Modelado Entidad-Relación', '2026-11-30', 20.00, 1);

-- Paso B: Capturar ID autogenerado de la actividad
SET @nueva_actividad_id = LAST_INSERT_ID();

-- Paso C: Vincular el documento digital (PDF subido de hasta 64MB)
INSERT INTO teleaula_db.recursos (id_tiporecurso, tiporecurso, ubicacion, id_actividades)
VALUES (1, 'Guía: Taller Modelado E-R', '/uploads/guia_taller_er_2026.pdf', @nueva_actividad_id);

-- Paso D: Asentar la traza de auditoría en teleaula_rbac
INSERT INTO teleaula_rbac.auditoria_logs (usuario_id, accion, tabla_afectada, registro_id)
VALUES (3, 'PUBLICAR_ACTIVIDAD_CON_GUIA', 'actividad', @nueva_actividad_id);

COMMIT;

-- 2. Validación de Seguridad RBAC en Backend: ¿Usuario (id=3) tiene permiso 'CREAR' en '/escolar/profesores'?
SELECT COUNT(*) > 0 AS autorizado
FROM teleaula_rbac.usuario u
JOIN teleaula_rbac.r_usuario_rol ur ON u.id = ur.usuario_id
JOIN teleaula_rbac.r_modulo_rol mr ON ur.rol_id = mr.rol_id
JOIN teleaula_rbac.vistas_permiso vp ON mr.id = vp.r_modulo_rol_id
JOIN teleaula_rbac.vistas v ON vp.vista_id = v.id
JOIN teleaula_rbac.permisos p ON vp.permiso_id = p.id
WHERE u.id = 3 
  AND v.ruta_acceso = '/escolar/profesores' 
  AND p.nombre_permiso = 'CREAR'
  AND mr.habilitado = TRUE 
  AND vp.permitido = TRUE;
```

> **⚠️ REGLA DE ORO DE SEGURIDAD CONTRA INYECCIÓN SQL:**  
> Queda estrictamente prohibida la concatenación directa de cadenas de texto en las consultas SQL del backend. Toda interacción con MariaDB desde Spring Boot debe realizarse mediante **Consultas Preparadas (Prepared Statements con Parámetros Bind)** utilizando `JdbcTemplate` o repositorios JPA para neutralizar vectores de ataque por inyección SQL.

---

## SECCIÓN 4. ARQUITECTURA DEL DASHBOARD ANALÍTICO Y CONTROL POR ROL

### Arquitectura Fullstack en 3 Capas:
1. **Capa 1: Frontend SPA React 18 + Vite (Nginx - Puerto 3008)**
   - Landing Page Institucional (`/` e `/inicio`).
   - Botón *"Sistema"* redirigiendo a `/login`.
   - Sidebar dinámico generado según `r_modulo_rol` y `vistas`.
   - Modales interactivos (creación y edición de docentes, alumnos, tareas).
2. **Capa 2: Backend Spring Boot (Eclipse Temurin JRE 25 - Puerto 8083)**
   - Controladores REST de Autenticación, Gestión Escolar y Aula Virtual.
   - Dual DataSource HikariCP conectando a `teleaula_db` y `teleaula_rbac`.
   - Endpoint de subida multipart con soporte para archivos de hasta 64MB.
3. **Capa 3: Motor Relacional MariaDB 10.11 (Puerto 3318)**
   - Motor transaccional `InnoDB`.
   - Aislamiento ACID, claves foráneas en cascada y auditoría activa.

---

## SECCIÓN 5. MATRIZ DE PRUEBAS DE VALIDACIÓN Y SEGURIDAD RBAC

| ID TEST | COMPONENTE EVALUADO | ACCIÓN EJECUTADA | RESULTADO ESPERADO | REGLA TÉCNICA | ESTADO |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TEST-01** | Integridad Referencial | Intento de borrar un rol asignado en `r_usuario_rol` | Operación bloqueada | Restricción `ON DELETE RESTRICT` | **PASÓ** |
| **TEST-02** | Atomicidad ACID | Fallo simulado a mitad de una transacción de carga | Reversión completa de datos | Bloque `ROLLBACK` automático | **PASÓ** |
| **TEST-03** | Acceso a Módulo | Estudiante intenta abrir módulo de configuración RBAC | Menú oculto y bloqueo HTTP 403 | Verificación en `r_modulo_rol` | **PASÓ** |
| **TEST-04** | Acción en Vista | Usuario sin permiso intenta pulsar botón de edición | Botón deshabilitado y API rechaza | Validación en `vistas_permiso` | **PASÓ** |
| **TEST-05** | Inyección SQL | Inyección maliciosa `' OR '1'='1` en login o búsqueda | Tratamiento como texto literal | Consultas Preparadas (Prepared Stmts) | **PASÓ** |
| **TEST-06** | Auditoría Activa | Modificación o eliminación de registro escolar | Generación automática de log | Inserción en `auditoria_logs` | **PASÓ** |

---

## SECCIÓN 6. ESTRUCTURA RECOMENDADA PARA LA PRESENTACIÓN Y DEFENSA

Metodología oficial de 6 pasos para la exposición ante el jurado calificador:

1. **Paso 1: Requisitos y Caso de Estudio:** Explicar la problemática de la institución escolar y justificar las entidades extraídas del negocio (alumnos, docentes, materias, secciones, cargas académicas e inscripciones).
2. **Paso 2: Modelo E-R Global y Normalización 3FN:** Demostrar la normalización de las tablas de `teleaula_db` y cómo coexisten de manera desacoplada con el subsistema de seguridad `teleaula_rbac`.
3. **Paso 3: Arquitectura de Seguridad RBAC Jerárquico:** Explicar el desacoplamiento de roles, módulos, vistas y permisos mediante la tabla intermedia `vistas_permiso`.
4. **Paso 4: Motor SQL (DDL, Vistas y Transacciones ACID):** Demostrar scripts DDL con claves primarias `id`, foráneas en cascada y transacciones multi-tabla atómicas para la publicación de tareas con guías PDF de hasta 64MB.
5. **Paso 5: Demostración de Dashboard en Vivo:** Navegación en la Landing Page pública, acceso al sistema vía botón *"Sistema"*, inicio de sesión con diferentes perfiles (SuperAdmin, Director, Docente, Alumno) evidenciando el renderizado dinámico del sidebar, pantallas y modales.
6. **Paso 6: Matriz de Pruebas y Validación:** Demostrar ante el jurado los resultados de las pruebas diagnósticas de integridad referencial, transaccionalidad ACID y prevención de inyección SQL.

> *"En la ingeniería informática, una base de datos bien modelada resuelve los procesos vitales de la institución educativa, mientras que un sistema RBAC robusto protege su integridad y gobierna su acceso."*  
> **— Prof. Mg. Jaider Ponce**
