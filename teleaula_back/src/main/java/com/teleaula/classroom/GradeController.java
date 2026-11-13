package com.teleaula.classroom;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/grades")
public class GradeController {

    private final JdbcTemplate jdbcTemplate;

    public GradeController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Retorna la nómina de estudiantes de la sección correspondiente a la actividad
     * con sus notas asentadas o pendientes de calificar.
     */
    @GetMapping("/activity/{activityId}")
    public ResponseEntity<List<Map<String, Object>>> getGradesByActivity(@PathVariable Long activityId) {
        String sql = """
            SELECT 
                a.id AS idAlumno,
                a.nombre_completo AS nombreAlumno,
                a.cedula,
                COALESCE(n.id, 0) AS idNota,
                n.calificacion,
                COALESCE(n.comentario, '') AS comentario,
                act.puntuacion_max AS puntuacionMax
            FROM teleaula_db.actividad act
            JOIN teleaula_db.r_s_p rsp ON rsp.id = act.id_r_s_p
            JOIN teleaula_db.inscripcion i ON i.id_seccion = rsp.id_seccion AND i.id_estado = 1
            JOIN teleaula_db.alumno a ON a.id = i.id_alumno
            LEFT JOIN teleaula_db.notas n ON n.id_actividad = act.id AND n.id_alumno = a.id
            WHERE act.id = ?
            ORDER BY a.nombre_completo ASC
            """;
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql, activityId);
        return ResponseEntity.ok(list);
    }

    /**
     * Guarda o actualiza masivamente las notas de los estudiantes para una actividad
     */
    @PostMapping("/batch")
    @Transactional
    public ResponseEntity<?> saveGradesBatch(@RequestBody Map<String, Object> body) {
        Object activityIdObj = body.get("idActividad");
        List<?> grades = (List<?>) body.get("grades");

        if (activityIdObj == null || grades == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Actividad y lista de calificaciones son obligatorias"));
        }

        Long activityId = Long.valueOf(activityIdObj.toString());

        for (Object item : grades) {
            if (!(item instanceof Map<?, ?> gradeMap)) continue;
            Object alumnoIdObj = gradeMap.get("idAlumno");
            Object calificacionObj = gradeMap.get("calificacion");
            Object comentarioObj = gradeMap.get("comentario");
            String comentario = comentarioObj != null ? comentarioObj.toString() : "";

            if (alumnoIdObj == null || calificacionObj == null || calificacionObj.toString().isBlank()) continue;

            Long idAlumno = Long.valueOf(alumnoIdObj.toString());
            double calificacion = Double.parseDouble(calificacionObj.toString());

            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM teleaula_db.notas WHERE id_alumno = ? AND id_actividad = ?",
                Integer.class, idAlumno, activityId
            );

            if (exists != null && exists > 0) {
                jdbcTemplate.update("""
                    UPDATE teleaula_db.notas 
                    SET calificacion = ?, comentario = ? 
                    WHERE id_alumno = ? AND id_actividad = ?
                    """, calificacion, comentario != null ? comentario.trim() : "", idAlumno, activityId);
            } else {
                jdbcTemplate.update("""
                    INSERT INTO teleaula_db.notas (id_alumno, id_actividad, calificacion, comentario)
                    VALUES (?, ?, ?, ?)
                    """, idAlumno, activityId, calificacion, comentario != null ? comentario.trim() : "");
            }
        }

        return ResponseEntity.ok(Map.of("message", "Calificaciones guardadas con éxito"));
    }

    /**
     * Retorna el boletín de notas de un estudiante
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Map<String, Object>>> getGradesByStudent(@PathVariable Long studentId) {
        String sql = """
            SELECT 
                n.id AS idNota,
                m.nombre_materia AS nombreMateria,
                m.codigo_materia AS codigoMateria,
                act.nombre_actividad AS nombreActividad,
                DATE_FORMAT(act.fecha_entrega, '%Y-%m-%d') AS fechaEntrega,
                act.puntuacion_max AS puntuacionMax,
                n.calificacion,
                COALESCE(n.comentario, '') AS comentario
            FROM teleaula_db.notas n
            JOIN teleaula_db.actividad act ON act.id = n.id_actividad
            JOIN teleaula_db.r_s_p rsp ON rsp.id = act.id_r_s_p
            JOIN teleaula_db.materia m ON m.id = rsp.id_materia
            WHERE n.id_alumno = ?
            ORDER BY act.fecha_entrega DESC
            """;
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql, studentId);
        return ResponseEntity.ok(list);
    }
}
