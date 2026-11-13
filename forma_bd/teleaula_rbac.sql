-- ========================================================
-- SISTEMA DE CONTROL DE ACCESO BASADO EN ROLES (RBAC)
-- Proyecto: Teleaula
-- Base de Datos: `teleaula_rbac`
-- Motor: MariaDB / MySQL (InnoDB)
-- Codificación: utf8mb4_unicode_ci
-- ========================================================

CREATE DATABASE IF NOT EXISTS `teleaula_rbac`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `teleaula_rbac`;

GRANT ALL PRIVILEGES ON `teleaula_rbac`.* TO 'teleaula_user'@'%';
FLUSH PRIVILEGES;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `auditoria_logs`;
DROP TABLE IF EXISTS `vistas_permiso`;
DROP TABLE IF EXISTS `r_modulo_rol`;
DROP TABLE IF EXISTS `r_usuario_rol`;
DROP TABLE IF EXISTS `permisos`;
DROP TABLE IF EXISTS `vistas`;
DROP TABLE IF EXISTS `modulo`;
DROP TABLE IF EXISTS `rol`;
DROP TABLE IF EXISTS `usuario`;

SET FOREIGN_KEY_CHECKS = 1;

-- --------------------------------------------------------
-- 1. TABLA PRINCIPAL DE USUARIOS
-- --------------------------------------------------------
CREATE TABLE `usuario` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) DEFAULT NULL,
  `numero_documento` VARCHAR(20) DEFAULT NULL,
  `telefono` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(120) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuario_email` (`email`),
  UNIQUE KEY `uq_usuario_documento` (`numero_documento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. ROLES DEL SISTEMA
-- --------------------------------------------------------
CREATE TABLE `rol` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre_rol` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rol_nombre` (`nombre_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. MÓDULOS DEL SISTEMA
-- --------------------------------------------------------
CREATE TABLE `modulo` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre_modulo` VARCHAR(60) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `icono` VARCHAR(50) DEFAULT NULL,
  `orden` INT(11) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_modulo_nombre` (`nombre_modulo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. PANTALLAS / VISTAS (SUBMÓDULOS)
-- --------------------------------------------------------
CREATE TABLE `vistas` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `id_modulo` INT(11) DEFAULT NULL,
  `nombre_vista` VARCHAR(80) NOT NULL,
  `icono` VARCHAR(50) DEFAULT 'dashboard',
  `ruta_acceso` VARCHAR(120) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  `orden` INT(11) DEFAULT 1,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vistas_ruta` (`ruta_acceso`),
  KEY `fk_vistas_modulo_idx` (`id_modulo`),
  CONSTRAINT `fk_vistas_modulo` FOREIGN KEY (`id_modulo`) REFERENCES `modulo` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. CATÁLOGO DE PERMISOS GRANULARES
-- --------------------------------------------------------
CREATE TABLE `permisos` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `nombre_permiso` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_permiso_nombre` (`nombre_permiso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. ASIGNACIÓN DE USUARIO A ROLES (RELACIÓN M:N)
-- --------------------------------------------------------
CREATE TABLE `r_usuario_rol` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) NOT NULL,
  `rol_id` INT(11) NOT NULL,
  `fecha_asignacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuario_rol` (`usuario_id`, `rol_id`),
  KEY `fk_rur_rol_idx` (`rol_id`),
  CONSTRAINT `fk_rur_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rur_rol` FOREIGN KEY (`rol_id`) REFERENCES `rol` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. ASIGNACIÓN DE MÓDULOS A ROLES (RELACIÓN M:N)
-- --------------------------------------------------------
CREATE TABLE `r_modulo_rol` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `rol_id` INT(11) NOT NULL,
  `modulo_id` INT(11) NOT NULL,
  `habilitado` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rol_modulo` (`rol_id`, `modulo_id`),
  KEY `fk_rmr_modulo_idx` (`modulo_id`),
  CONSTRAINT `fk_rmr_rol` FOREIGN KEY (`rol_id`) REFERENCES `rol` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rmr_modulo` FOREIGN KEY (`modulo_id`) REFERENCES `modulo` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. AUTORIZACIÓN GRANULAR (VISTAS Y PERMISOS POR ROL)
-- --------------------------------------------------------
CREATE TABLE `vistas_permiso` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `r_modulo_rol_id` INT(11) NOT NULL,
  `vista_id` INT(11) NOT NULL,
  `permiso_id` INT(11) NOT NULL,
  `permitido` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vistas_permiso` (`r_modulo_rol_id`, `vista_id`, `permiso_id`),
  KEY `fk_vp_vista_idx` (`vista_id`),
  KEY `fk_vp_permiso_idx` (`permiso_id`),
  CONSTRAINT `fk_vp_modulo_rol` FOREIGN KEY (`r_modulo_rol_id`) REFERENCES `r_modulo_rol` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_vp_vista` FOREIGN KEY (`vista_id`) REFERENCES `vistas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_vp_permiso` FOREIGN KEY (`permiso_id`) REFERENCES `permisos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. AUDITORÍA Y TRAZABILIDAD DE ACCIONES
-- --------------------------------------------------------
CREATE TABLE `auditoria_logs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` INT(11) DEFAULT NULL,
  `accion` VARCHAR(100) NOT NULL,
  `tabla_afectada` VARCHAR(50) NOT NULL,
  `registro_id` INT(11) DEFAULT NULL,
  `detalles` TEXT DEFAULT NULL,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_auditoria_usuario_idx` (`usuario_id`),
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
