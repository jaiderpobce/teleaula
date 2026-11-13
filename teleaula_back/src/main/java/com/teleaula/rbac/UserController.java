package com.teleaula.rbac;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final JdbcTemplate jdbcTemplate;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        String sql = """
            SELECT 
                u.id, 
                u.nombre, 
                COALESCE(u.apellido, '') AS apellido,
                COALESCE(u.numero_documento, '') AS documento,
                COALESCE(u.telefono, '') AS telefono,
                u.email, 
                u.activo,
                DATE_FORMAT(u.fecha_creacion, '%Y-%m-%d %H:%i') AS fechaCreacion,
                COALESCE(GROUP_CONCAT(r.nombre_rol SEPARATOR ', '), 'Sin Rol') AS roles,
                COALESCE(GROUP_CONCAT(r.id), '') AS roleIds
            FROM teleaula_rbac.usuario u
            LEFT JOIN teleaula_rbac.r_usuario_rol rur ON rur.usuario_id = u.id
            LEFT JOIN teleaula_rbac.rol r ON r.id = rur.rol_id
            GROUP BY u.id
            ORDER BY u.id ASC
            """;
        List<Map<String, Object>> users = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(users);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> body) {
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        String nombre = (String) body.get("nombre");
        String apellido = (String) body.getOrDefault("apellido", "");
        String documento = (String) body.getOrDefault("documento", "");
        String telefono = (String) body.getOrDefault("telefono", "");

        if (email == null || email.isBlank() || password == null || password.isBlank() || nombre == null || nombre.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nombre, correo y contraseña son obligatorios"));
        }

        Integer existingEmail = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM teleaula_rbac.usuario WHERE LOWER(email) = LOWER(?)", 
            Integer.class, email.trim()
        );
        if (existingEmail != null && existingEmail > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Ya existe un usuario registrado con este correo"));
        }

        String hash = passwordEncoder.encode(password.trim());
        jdbcTemplate.update("""
            INSERT INTO teleaula_rbac.usuario (nombre, apellido, numero_documento, telefono, email, password_hash, activo)
            VALUES (?, ?, ?, ?, ?, ?, 1)
            """, nombre.trim(), apellido.trim(), documento.trim(), telefono.trim(), email.trim(), hash);

        Long newId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        // Si se envió rol inicial, asignarlo
        if (body.containsKey("roleId") && body.get("roleId") != null) {
            Long roleId = Long.valueOf(body.get("roleId").toString());
            jdbcTemplate.update("INSERT INTO teleaula_rbac.r_usuario_rol (usuario_id, rol_id) VALUES (?, ?)", newId, roleId);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Usuario creado con éxito", "id", newId));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String nombre = (String) body.get("nombre");
        String apellido = (String) body.getOrDefault("apellido", "");
        String documento = (String) body.getOrDefault("documento", "");
        String telefono = (String) body.getOrDefault("telefono", "");
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        Object activoObj = body.get("activo");

        if (nombre == null || email == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nombre y correo son obligatorios"));
        }

        Integer emailConflict = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM teleaula_rbac.usuario WHERE LOWER(email) = LOWER(?) AND id <> ?", 
            Integer.class, email.trim(), id
        );
        if (emailConflict != null && emailConflict > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "El correo ya está en uso por otro usuario"));
        }

        int activo = activoObj != null ? (((Boolean) activoObj) || "1".equals(activoObj.toString()) ? 1 : 0) : 1;

        if (password != null && !password.isBlank()) {
            String hash = passwordEncoder.encode(password.trim());
            jdbcTemplate.update("""
                UPDATE teleaula_rbac.usuario 
                SET nombre = ?, apellido = ?, numero_documento = ?, telefono = ?, email = ?, password_hash = ?, activo = ?
                WHERE id = ?
                """, nombre.trim(), apellido.trim(), documento.trim(), telefono.trim(), email.trim(), hash, activo, id);
        } else {
            jdbcTemplate.update("""
                UPDATE teleaula_rbac.usuario 
                SET nombre = ?, apellido = ?, numero_documento = ?, telefono = ?, email = ?, activo = ?
                WHERE id = ?
                """, nombre.trim(), apellido.trim(), documento.trim(), telefono.trim(), email.trim(), activo, id);
        }

        return ResponseEntity.ok(Map.of("message", "Usuario actualizado correctamente"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (id == 1) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "No se permite eliminar la cuenta de Superadministrador"));
        }
        jdbcTemplate.update("DELETE FROM teleaula_rbac.r_usuario_rol WHERE usuario_id = ?", id);
        int rows = jdbcTemplate.update("DELETE FROM teleaula_rbac.usuario WHERE id = ?", id);
        if (rows > 0) {
            return ResponseEntity.ok(Map.of("message", "Usuario eliminado con éxito"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Usuario no encontrado"));
    }

    @GetMapping("/{id}/roles")
    public ResponseEntity<?> getUserRoles(@PathVariable Long id) {
        String sql = """
            SELECT 
                r.id, 
                r.nombre_rol AS name, 
                r.descripcion AS description,
                CASE WHEN rur.usuario_id IS NOT NULL THEN TRUE ELSE FALSE END AS assigned
            FROM teleaula_rbac.rol r
            LEFT JOIN teleaula_rbac.r_usuario_rol rur ON rur.rol_id = r.id AND rur.usuario_id = ?
            ORDER BY r.id ASC
            """;
        List<Map<String, Object>> roles = jdbcTemplate.queryForList(sql, id);
        return ResponseEntity.ok(roles);
    }

    @PutMapping("/{id}/roles")
    @Transactional
    public ResponseEntity<?> updateUserRoles(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (id == 1) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "No se pueden revocar los roles del Superadministrador"));
        }
        List<?> roleIds = (List<?>) body.get("roleIds");
        if (roleIds == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lista de roles no provista"));
        }

        jdbcTemplate.update("DELETE FROM teleaula_rbac.r_usuario_rol WHERE usuario_id = ?", id);
        for (Object rId : roleIds) {
            Long roleId = Long.valueOf(rId.toString());
            jdbcTemplate.update("INSERT INTO teleaula_rbac.r_usuario_rol (usuario_id, rol_id) VALUES (?, ?)", id, roleId);
        }

        return ResponseEntity.ok(Map.of("message", "Roles actualizados con éxito"));
    }
}
