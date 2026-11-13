package com.teleaula.academic;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final JdbcTemplate jdbcTemplate;

    public EnrollmentController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllEnrollments() {
        String sql = """
            SELECT 
                i.id,
                i.id_alumno AS idAlumno,
                a.nombre_completo AS nombreAlumno,
                a.cedula AS cedulaAlumno,
                i.id_seccion AS idSeccion,
                s.numero_seccion AS numeroSeccion,
                i.id_periodo AS idPeriodo,
                per.nombre_periodo AS nombrePeriodo,
                DATE_FORMAT(i.fecha_inscripcion, '%Y-%m-%d') AS fechaInscripcion,
                i.id_estado_inscripcion AS idEstadoInscripcion,
                COALESCE(ei.nombre_estado, 'Inscrito Regular') AS estadoInscripcion,
                COALESCE(d.tipo_inscripcion, 'Regular') AS tipoInscripcion,
                COALESCE(d.observaciones, '') AS observaciones
            FROM teleaula_db.inscripcion i
            JOIN teleaula_db.alumno a ON a.id = i.id_alumno
            JOIN teleaula_db.seccion s ON s.id = i.id_seccion
            JOIN teleaula_db.periodo per ON per.id = i.id_periodo
            LEFT JOIN teleaula_db.estado_inscripcion ei ON ei.id = i.id_estado_inscripcion
            LEFT JOIN teleaula_db.detalles_ins d ON d.id_inscripcion = i.id
            ORDER BY i.id DESC
            """;
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createEnrollment(@RequestBody Map<String, Object> body) {
        Object alumnoIdObj = body.get("idAlumno");
        Object seccionIdObj = body.get("idSeccion");
        Object periodoIdObj = body.getOrDefault("idPeriodo", 1);
        Object estadoIdObj = body.getOrDefault("idEstadoInscripcion", 1);
        String tipo = (String) body.getOrDefault("tipoInscripcion", "Regular");
        String observaciones = (String) body.getOrDefault("observaciones", "");

        if (alumnoIdObj == null || seccionIdObj == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Alumno y sección son obligatorios"));
        }

        Long idAlumno = Long.valueOf(alumnoIdObj.toString());
        Long idSeccion = Long.valueOf(seccionIdObj.toString());
        Long idPeriodo = Long.valueOf(periodoIdObj.toString());
        Long idEstadoInscripcion = Long.valueOf(estadoIdObj.toString());

        // Verificar si ya está inscrito en este período
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM teleaula_db.inscripcion WHERE id_alumno = ? AND id_periodo = ?",
            Integer.class, idAlumno, idPeriodo
        );
        if (count != null && count > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "El estudiante ya cuenta con una inscripción activa en este período"));
        }

        jdbcTemplate.update("""
            INSERT INTO teleaula_db.inscripcion (id_alumno, id_seccion, id_periodo, fecha_inscripcion, id_estado_inscripcion, id_estado)
            VALUES (?, ?, ?, CURDATE(), ?, 1)
            """, idAlumno, idSeccion, idPeriodo, idEstadoInscripcion);

        Long newId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        jdbcTemplate.update("""
            INSERT INTO teleaula_db.detalles_ins (fecha_registro, tipo_inscripcion, observaciones, id_inscripcion)
            VALUES (CURDATE(), ?, ?, ?)
            """, tipo, observaciones, newId);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Inscripción formalizada con éxito", "id", newId));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteEnrollment(@PathVariable Long id) {
        int rows = jdbcTemplate.update("DELETE FROM teleaula_db.inscripcion WHERE id = ?", id);
        if (rows > 0) {
            return ResponseEntity.ok(Map.of("message", "Inscripción cancelada con éxito"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Inscripción no encontrada"));
    }
}
