package com.teleaula.rbac;

import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final JdbcTemplate jdbcTemplate;

    public RoleController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllRoles() {
        String sql = """
            SELECT 
                r.id,
                r.nombre_rol AS name,
                COALESCE(r.descripcion, '') AS description,
                COUNT(DISTINCT rur.usuario_id) AS usersCount,
                COUNT(DISTINCT CASE WHEN rmr.habilitado = 1 THEN rmr.modulo_id END) AS modulesCount,
                COUNT(DISTINCT CASE WHEN vp.permitido = 1 THEN vp.id END) AS permissionsCount,
                'ACTIVO' AS status
            FROM teleaula_rbac.rol r
            LEFT JOIN teleaula_rbac.r_usuario_rol rur ON rur.rol_id = r.id
            LEFT JOIN teleaula_rbac.r_modulo_rol rmr ON rmr.rol_id = r.id
            LEFT JOIN teleaula_rbac.vistas_permiso vp ON vp.r_modulo_rol_id = rmr.id
            GROUP BY r.id, r.nombre_rol, r.descripcion
            ORDER BY r.id ASC
            """;
        List<Map<String, Object>> roles = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(roles);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createRole(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.getOrDefault("description", "");

        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre del rol es obligatorio"));
        }

        String normalizedName = name.trim().toUpperCase().replace(" ", "_");

        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM teleaula_rbac.rol WHERE UPPER(nombre_rol) = ?",
            Integer.class, normalizedName
        );
        if (count != null && count > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Ya existe un rol con ese nombre"));
        }

        jdbcTemplate.update(
            "INSERT INTO teleaula_rbac.rol (nombre_rol, descripcion) VALUES (?, ?)",
            normalizedName, description.trim()
        );

        Long roleId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        // Inicializar relaciones de módulos
        List<Long> moduleIds = jdbcTemplate.queryForList("SELECT id FROM teleaula_rbac.modulo", Long.class);
        for (Long modId : moduleIds) {
            jdbcTemplate.update(
                "INSERT INTO teleaula_rbac.r_modulo_rol (rol_id, modulo_id, habilitado) VALUES (?, ?, 0)",
                roleId, modId
            );
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "message", "Rol creado con éxito",
            "id", roleId,
            "name", normalizedName,
            "description", description
        ));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (id == 1) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "El rol SUPERADMIN está protegido y no puede ser alterado"));
        }

        String name = (String) body.get("name");
        String description = (String) body.getOrDefault("description", "");

        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El nombre del rol es obligatorio"));
        }

        String normalizedName = name.trim().toUpperCase().replace(" ", "_");

        Integer conflict = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM teleaula_rbac.rol WHERE UPPER(nombre_rol) = ? AND id <> ?",
            Integer.class, normalizedName, id
        );
        if (conflict != null && conflict > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Ya existe otro rol con ese nombre"));
        }

        jdbcTemplate.update(
            "UPDATE teleaula_rbac.rol SET nombre_rol = ?, descripcion = ? WHERE id = ?",
            normalizedName, description.trim(), id
        );

        return ResponseEntity.ok(Map.of("message", "Rol actualizado con éxito", "id", id, "name", normalizedName));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteRole(@PathVariable Long id) {
        if (id == 1) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "No se permite eliminar el rol SUPERADMIN del sistema"));
        }

        Integer userCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM teleaula_rbac.r_usuario_rol WHERE rol_id = ?",
            Integer.class, id
        );
        if (userCount != null && userCount > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("message", "No se puede eliminar el rol porque tiene " + userCount + " usuario(s) asignado(s)"));
        }

        jdbcTemplate.update("DELETE FROM teleaula_rbac.vistas_permiso WHERE r_modulo_rol_id IN (SELECT id FROM teleaula_rbac.r_modulo_rol WHERE rol_id = ?)", id);
        jdbcTemplate.update("DELETE FROM teleaula_rbac.r_modulo_rol WHERE rol_id = ?", id);
        jdbcTemplate.update("DELETE FROM teleaula_rbac.rol WHERE id = ?", id);

        return ResponseEntity.ok(Map.of("message", "Rol eliminado con éxito"));
    }

    @GetMapping("/{id}/matrix")
    public ResponseEntity<?> getRolePermissionsMatrix(@PathVariable Long id) {
        Map<String, Object> role = jdbcTemplate.queryForMap(
            "SELECT id, nombre_rol AS name, COALESCE(descripcion, '') AS description FROM teleaula_rbac.rol WHERE id = ?", id
        );

        String modulesSql = """
            SELECT 
                m.id AS moduleId,
                m.nombre_modulo AS moduleName,
                COALESCE(m.descripcion, '') AS description,
                COALESCE(m.icono, 'folder') AS icon,
                COALESCE(rmr.habilitado, 0) AS enabled,
                rmr.id AS rModuloRolId
            FROM teleaula_rbac.modulo m
            LEFT JOIN teleaula_rbac.r_modulo_rol rmr ON rmr.modulo_id = m.id AND rmr.rol_id = ?
            ORDER BY m.orden ASC, m.id ASC
            """;
        List<Map<String, Object>> modules = jdbcTemplate.queryForList(modulesSql, id);

        String viewsSql = """
            SELECT 
                v.id AS viewId,
                v.id_modulo AS moduleId,
                v.nombre_vista AS viewName,
                COALESCE(v.icono, 'dashboard') AS icon,
                v.ruta_acceso AS route,
                COALESCE(v.descripcion, '') AS description
            FROM teleaula_rbac.vistas v
            WHERE v.activo = 1
            ORDER BY v.orden ASC, v.id ASC
            """;
        List<Map<String, Object>> allViews = jdbcTemplate.queryForList(viewsSql);

        String permissionsSql = """
            SELECT id AS permissionId, nombre_permiso AS name, COALESCE(descripcion, '') AS description
            FROM teleaula_rbac.permisos
            ORDER BY id ASC
            """;
        List<Map<String, Object>> allPermissions = jdbcTemplate.queryForList(permissionsSql);

        String grantedSql = """
            SELECT vp.vista_id, vp.permiso_id, vp.permitido
            FROM teleaula_rbac.vistas_permiso vp
            JOIN teleaula_rbac.r_modulo_rol rmr ON rmr.id = vp.r_modulo_rol_id
            WHERE rmr.rol_id = ?
            """;
        List<Map<String, Object>> grantedList = jdbcTemplate.queryForList(grantedSql, id);
        Map<String, Boolean> grantedMap = new HashMap<>();
        for (Map<String, Object> g : grantedList) {
            String key = g.get("vista_id") + "_" + g.get("permiso_id");
            grantedMap.put(key, ((Number) g.get("permitido")).intValue() == 1);
        }

        List<Map<String, Object>> structuredModules = new ArrayList<>();
        for (Map<String, Object> m : modules) {
            Long modId = ((Number) m.get("moduleId")).longValue();
            boolean modEnabled = ((Number) m.get("enabled")).intValue() == 1;

            List<Map<String, Object>> moduleViews = new ArrayList<>();
            for (Map<String, Object> v : allViews) {
                Long vModId = ((Number) v.get("moduleId")).longValue();
                if (vModId.equals(modId)) {
                    Long viewId = ((Number) v.get("viewId")).longValue();

                    List<Map<String, Object>> viewPerms = new ArrayList<>();
                    for (Map<String, Object> p : allPermissions) {
                        Long pId = ((Number) p.get("permissionId")).longValue();
                        String key = viewId + "_" + pId;
                        boolean allowed = grantedMap.getOrDefault(key, false);

                        viewPerms.add(Map.of(
                            "permissionId", pId,
                            "name", p.get("name"),
                            "description", p.get("description"),
                            "allowed", allowed
                        ));
                    }

                    boolean viewEnabled = grantedMap.getOrDefault(viewId + "_1", false);
                    Map<String, Object> viewObj = new HashMap<>(v);
                    viewObj.put("enabled", viewEnabled);
                    viewObj.put("permissions", viewPerms);
                    moduleViews.add(viewObj);
                }
            }

            Map<String, Object> modObj = new HashMap<>();
            modObj.put("moduleId", modId);
            modObj.put("moduleName", m.get("moduleName"));
            modObj.put("description", m.get("description"));
            modObj.put("icon", m.get("icon"));
            modObj.put("enabled", modEnabled);
            modObj.put("views", moduleViews);
            structuredModules.add(modObj);
        }

        return ResponseEntity.ok(Map.of(
            "roleId", id,
            "roleName", role.get("name"),
            "description", role.get("description"),
            "modules", structuredModules
        ));
    }

    @PutMapping("/{id}/matrix")
    @Transactional
    public ResponseEntity<?> updateRolePermissionsMatrix(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (id == 1) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "La matriz del SUPERADMIN es fija y posee todos los privilegios"));
        }

        List<?> modules = (List<?>) body.get("modules");
        if (modules == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Estructura de módulos no provista"));
        }

        for (Object modObj : modules) {
            if (!(modObj instanceof Map<?, ?> modMap)) continue;
            Long moduleId = Long.valueOf(modMap.get("moduleId").toString());
            boolean enabled = Boolean.TRUE.equals(modMap.get("enabled")) || "true".equalsIgnoreCase(String.valueOf(modMap.get("enabled")));

            String rmrSql = "SELECT id FROM teleaula_rbac.r_modulo_rol WHERE rol_id = ? AND modulo_id = ?";
            List<Long> rmrIds = jdbcTemplate.queryForList(rmrSql, Long.class, id, moduleId);
            Long rModuloRolId;
            if (rmrIds.isEmpty()) {
                jdbcTemplate.update("INSERT INTO teleaula_rbac.r_modulo_rol (rol_id, modulo_id, habilitado) VALUES (?, ?, ?)", id, moduleId, enabled ? 1 : 0);
                rModuloRolId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
            } else {
                rModuloRolId = rmrIds.get(0);
                jdbcTemplate.update("UPDATE teleaula_rbac.r_modulo_rol SET habilitado = ? WHERE id = ?", enabled ? 1 : 0, rModuloRolId);
            }

            jdbcTemplate.update("DELETE FROM teleaula_rbac.vistas_permiso WHERE r_modulo_rol_id = ?", rModuloRolId);

            if (enabled && modMap.containsKey("views")) {
                List<?> views = (List<?>) modMap.get("views");
                for (Object viewObj : views) {
                    if (!(viewObj instanceof Map<?, ?> viewMap)) continue;
                    Long viewId = Long.valueOf(viewMap.get("viewId").toString());
                    boolean viewEnabled = Boolean.TRUE.equals(viewMap.get("enabled")) || "true".equalsIgnoreCase(String.valueOf(viewMap.get("enabled")));

                    if (viewEnabled) {
                        jdbcTemplate.update(
                            "INSERT INTO teleaula_rbac.vistas_permiso (r_modulo_rol_id, vista_id, permiso_id, permitido) VALUES (?, ?, 1, 1)",
                            rModuloRolId, viewId
                        );

                        if (viewMap.containsKey("permissions")) {
                            List<?> permissions = (List<?>) viewMap.get("permissions");
                            for (Object permObj : permissions) {
                                if (!(permObj instanceof Map<?, ?> permMap)) continue;
                                Long permId = Long.valueOf(permMap.get("permissionId").toString());
                                if (permId == 1) continue;
                                boolean allowed = Boolean.TRUE.equals(permMap.get("allowed")) || "true".equalsIgnoreCase(String.valueOf(permMap.get("allowed")));

                                jdbcTemplate.update(
                                    "INSERT INTO teleaula_rbac.vistas_permiso (r_modulo_rol_id, vista_id, permiso_id, permitido) VALUES (?, ?, ?, ?)",
                                    rModuloRolId, viewId, permId, allowed ? 1 : 0
                                );
                            }
                        }
                    }
                }
            }
        }

        return ResponseEntity.ok(Map.of("message", "Matriz de roles, módulos y permisos actualizada con éxito"));
    }
}
