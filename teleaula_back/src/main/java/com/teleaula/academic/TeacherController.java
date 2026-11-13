package com.teleaula.academic;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    private final JdbcTemplate jdbcTemplate;

    public TeacherController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllTeachers() {
        String sql = """
            SELECT 
                p.id, 
                p.nombre_completo AS nombreCompleto, 
                p.cedula, 
                p.especialidad,
                COUNT(DISTINCT rsp.id) AS materiasAsignadas
            FROM teleaula_db.profesor p
            LEFT JOIN teleaula_db.r_s_p rsp ON rsp.id_profesor = p.id
            GROUP BY p.id, p.nombre_completo, p.cedula, p.especialidad
            ORDER BY p.id DESC
            """;
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createTeacher(@RequestBody Map<String, Object> body) {
        String nombre = (String) body.get("nombreCompleto");
        String cedula = (String) body.get("cedula");
        String especialidad = (String) body.getOrDefault("especialidad", "Docencia General");

        if (nombre == null || cedula == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nombre y cédula son requeridos"));
        }

        Integer exists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM teleaula_db.profesor WHERE LOWER(cedula) = LOWER(?)", 
            Integer.class, cedula.trim()
        );
        if (exists != null && exists > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Ya existe un profesor con esa cédula"));
        }

        jdbcTemplate.update(
            "INSERT INTO teleaula_db.profesor (nombre_completo, cedula, especialidad) VALUES (?, ?, ?)",
            nombre.trim(), cedula.trim(), especialidad.trim()
        );
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Profesor registrado con éxito", "id", id));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateTeacher(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String nombre = (String) body.get("nombreCompleto");
        String cedula = (String) body.get("cedula");
        String especialidad = (String) body.getOrDefault("especialidad", "Docencia General");

        if (nombre == null || cedula == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nombre y cédula son requeridos"));
        }

        Integer exists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM teleaula_db.profesor WHERE LOWER(cedula) = LOWER(?) AND id <> ?", 
            Integer.class, cedula.trim(), id
        );
        if (exists != null && exists > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "La cédula ya pertenece a otro profesor"));
        }

        jdbcTemplate.update(
            "UPDATE teleaula_db.profesor SET nombre_completo = ?, cedula = ?, especialidad = ? WHERE id = ?",
            nombre.trim(), cedula.trim(), especialidad.trim(), id
        );

        return ResponseEntity.ok(Map.of("message", "Profesor actualizado correctamente"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteTeacher(@PathVariable Long id) {
        int rows = jdbcTemplate.update("DELETE FROM teleaula_db.profesor WHERE id = ?", id);
        if (rows > 0) {
            return ResponseEntity.ok(Map.of("message", "Profesor eliminado con éxito"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Profesor no encontrado"));
    }
}
