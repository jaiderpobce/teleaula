package com.teleaula.academic;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final JdbcTemplate jdbcTemplate;

    public StudentController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllStudents() {
        String sql = """
            SELECT 
                a.id, 
                a.nombre_completo AS nombreCompleto, 
                a.cedula, 
                a.correo_electronico AS correoElectronico,
                COUNT(DISTINCT i.id) AS totalInscripciones,
                COALESCE(s.numero_seccion, 'Sin Sección') AS seccionActual,
                COALESCE(ei.nombre_estado, 'No Inscrito') AS estadoInscripcion
            FROM teleaula_db.alumno a
            LEFT JOIN teleaula_db.inscripcion i ON i.id_alumno = a.id
            LEFT JOIN teleaula_db.seccion s ON s.id = i.id_seccion
            LEFT JOIN teleaula_db.estado_inscripcion ei ON ei.id = i.id_estado_inscripcion
            GROUP BY a.id, a.nombre_completo, a.cedula, a.correo_electronico
            ORDER BY a.id DESC
            """;
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createStudent(@RequestBody Map<String, Object> body) {
        String nombre = (String) body.get("nombreCompleto");
        String cedula = (String) body.get("cedula");
        String correo = (String) body.get("correoElectronico");

        if (nombre == null || cedula == null || correo == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nombre, cédula y correo son requeridos"));
        }

        Integer exists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM teleaula_db.alumno WHERE LOWER(cedula) = LOWER(?)", 
            Integer.class, cedula.trim()
        );
        if (exists != null && exists > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Ya existe un estudiante con esa cédula"));
        }

        jdbcTemplate.update(
            "INSERT INTO teleaula_db.alumno (nombre_completo, cedula, correo_electronico) VALUES (?, ?, ?)",
            nombre.trim(), cedula.trim(), correo.trim()
        );
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Estudiante registrado con éxito", "id", id));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String nombre = (String) body.get("nombreCompleto");
        String cedula = (String) body.get("cedula");
        String correo = (String) body.get("correoElectronico");

        if (nombre == null || cedula == null || correo == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nombre, cédula y correo son requeridos"));
        }

        Integer exists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM teleaula_db.alumno WHERE LOWER(cedula) = LOWER(?) AND id <> ?", 
            Integer.class, cedula.trim(), id
        );
        if (exists != null && exists > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "La cédula ya pertenece a otro estudiante"));
        }

        jdbcTemplate.update(
            "UPDATE teleaula_db.alumno SET nombre_completo = ?, cedula = ?, correo_electronico = ? WHERE id = ?",
            nombre.trim(), cedula.trim(), correo.trim(), id
        );

        return ResponseEntity.ok(Map.of("message", "Estudiante actualizado correctamente"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        int rows = jdbcTemplate.update("DELETE FROM teleaula_db.alumno WHERE id = ?", id);
        if (rows > 0) {
            return ResponseEntity.ok(Map.of("message", "Estudiante eliminado con éxito"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Estudiante no encontrado"));
    }
}
