package com.teleaula.auth;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JdbcTemplate jdbcTemplate;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Devuelve los submódulos autorizados de una vista específica o todos los del usuario
     */
    @GetMapping("/submodules")
    public List<SubmoduleDto> getSubmodules(
            @RequestParam(name = "userId", defaultValue = "1") Long userId,
            @RequestParam(name = "moduloId", required = false) Long moduloId,
            @RequestParam(name = "moduloRuta", required = false) String moduloRuta) {

        String sql = """
            SELECT DISTINCT
                v.id,
                v.id_modulo,
                v.nombre_vista,
                COALESCE(v.icono, 'dashboard') AS icono,
                v.ruta_acceso,
                v.descripcion,
                v.orden
            FROM teleaula_rbac.vistas v
            JOIN teleaula_rbac.modulo m ON m.id = v.id_modulo
            JOIN teleaula_rbac.r_modulo_rol rmr ON rmr.modulo_id = m.id AND rmr.habilitado = 1
            JOIN teleaula_rbac.r_usuario_rol rur ON rur.rol_id = rmr.rol_id
            WHERE rur.usuario_id = ?
              AND v.activo = 1
              AND v.orden > 0
              AND (? IS NULL OR v.id_modulo = ?)
              AND (? IS NULL OR v.ruta_acceso LIKE CONCAT(?, '%'))
            ORDER BY v.orden ASC, v.id ASC
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new SubmoduleDto(
                rs.getLong("id"),
                rs.getLong("id_modulo"),
                rs.getString("nombre_vista"),
                rs.getString("icono"),
                rs.getString("ruta_acceso"),
                rs.getString("descripcion"),
                rs.getInt("orden")
        ), userId, moduloId, moduloId, moduloRuta, moduloRuta);
    }

    /**
     * Endpoint para autenticación de usuarios (Login)
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        if (loginRequest.email() == null || loginRequest.password() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Correo y contraseña son requeridos"));
        }

        String userSql = """
            SELECT id, nombre, apellido, email, password_hash, activo, COALESCE(numero_documento, '') as documento
            FROM teleaula_rbac.usuario
            WHERE LOWER(email) = LOWER(?)
            """;

        List<Map<String, Object>> users = jdbcTemplate.queryForList(userSql, loginRequest.email().trim());

        if (users.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Credenciales incorrectas"));
        }

        Map<String, Object> userData = users.get(0);
        Object activoObj = userData.get("activo");
        boolean activo = Boolean.TRUE.equals(activoObj) 
            || (activoObj instanceof Number && ((Number) activoObj).intValue() == 1) 
            || "1".equals(String.valueOf(activoObj));

        if (!activo) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "El usuario está inactivo o suspendido"));
        }

        String passwordHash = (String) userData.get("password_hash");
        if (!passwordEncoder.matches(loginRequest.password(), passwordHash)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Credenciales incorrectas"));
        }

        Long userId = ((Number) userData.get("id")).longValue();

        // 1. Obtener Roles asignados
        String rolesSql = """
            SELECT r.id, r.nombre_rol
            FROM teleaula_rbac.rol r
            JOIN teleaula_rbac.r_usuario_rol rur ON rur.rol_id = r.id
            WHERE rur.usuario_id = ?
            """;
        List<String> roles = jdbcTemplate.query(rolesSql, (rs, rowNum) -> rs.getString("nombre_rol"), userId);

        // 2. Obtener Módulos accesibles
        String modulosSql = """
            SELECT DISTINCT m.id, m.nombre_modulo, m.descripcion, COALESCE(m.icono, 'folder') as icono
            FROM teleaula_rbac.modulo m
            JOIN teleaula_rbac.r_modulo_rol rmr ON rmr.modulo_id = m.id AND rmr.habilitado = 1
            JOIN teleaula_rbac.r_usuario_rol rur ON rur.rol_id = rmr.rol_id
            WHERE rur.usuario_id = ?
            ORDER BY m.orden ASC
            """;
        List<Map<String, Object>> modulos = jdbcTemplate.queryForList(modulosSql, userId);

        // 3. Obtener Submódulos accesibles
        List<SubmoduleDto> submodules = getSubmodules(userId, null, null);

        Map<String, Object> response = Map.of(
            "ok", true,
            "message", "Autenticación exitosa",
            "token", "teleaula-jwt-mock-" + userId + "-" + System.currentTimeMillis(),
            "user", Map.of(
                "id", userId,
                "nombre", userData.get("nombre"),
                "apellido", userData.get("apellido") != null ? userData.get("apellido") : "",
                "email", userData.get("email"),
                "documento", userData.get("documento"),
                "roles", roles
            ),
            "modules", modulos,
            "submodules", submodules
        );

        return ResponseEntity.ok(response);
    }

    public record LoginRequest(String email, String password) {}
    public record SubmoduleDto(Long id, Long idModulo, String nombre, String icono, String ruta, String descripcion, int orden) {}
}
