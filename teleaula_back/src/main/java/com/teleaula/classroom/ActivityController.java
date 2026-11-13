package com.teleaula.classroom;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final JdbcTemplate jdbcTemplate;

    public ActivityController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllActivities(
            @RequestParam(required = false) Long rspId,
            @RequestParam(required = false) Long seccionId) {
        String sql = """
            SELECT 
                act.id,
                act.id_r_s_p AS idRsp,
                act.nombre_actividad AS nombreActividad,
                DATE_FORMAT(act.fecha_entrega, '%Y-%m-%d') AS fechaEntrega,
                act.puntuacion_max AS puntuacionMax,
                act.id_status AS idStatus,
                st.descripcion AS statusDescripcion,
                s.numero_seccion AS numeroSeccion,
                m.nombre_materia AS nombreMateria,
                p.nombre_completo AS nombreProfesor,
                COUNT(DISTINCT n.id) AS alumnosCalificados,
                COUNT(DISTINCT r.id) AS totalRecursos
            FROM teleaula_db.actividad act
            JOIN teleaula_db.r_s_p rsp ON rsp.id = act.id_r_s_p
            JOIN teleaula_db.seccion s ON s.id = rsp.id_seccion
            JOIN teleaula_db.materia m ON m.id = rsp.id_materia
            JOIN teleaula_db.profesor p ON p.id = rsp.id_profesor
            JOIN teleaula_db.status st ON st.id = act.id_status
            LEFT JOIN teleaula_db.notas n ON n.id_actividad = act.id
            LEFT JOIN teleaula_db.recursos r ON r.id_actividades = act.id
            WHERE (? IS NULL OR act.id_r_s_p = ?)
              AND (? IS NULL OR rsp.id_seccion = ?)
            GROUP BY act.id, act.id_r_s_p, act.nombre_actividad, act.fecha_entrega, act.puntuacion_max, act.id_status, st.descripcion, s.numero_seccion, m.nombre_materia, p.nombre_completo
            ORDER BY act.fecha_entrega DESC, act.id DESC
            """;
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql, rspId, rspId, seccionId, seccionId);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createActivity(@RequestBody Map<String, Object> body) {
        Object rspIdObj = body.get("idRsp");
        String nombre = (String) body.get("nombreActividad");
        String fechaEntrega = (String) body.get("fechaEntrega");
        Object puntuacionObj = body.getOrDefault("puntuacionMax", 20.00);

        if (rspIdObj == null || nombre == null || fechaEntrega == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Carga académica, nombre y fecha de entrega son requeridos"));
        }

        Long idRsp = Long.valueOf(rspIdObj.toString());
        double puntuacion = Double.parseDouble(puntuacionObj.toString());

        jdbcTemplate.update("""
            INSERT INTO teleaula_db.actividad (id_r_s_p, nombre_actividad, fecha_entrega, puntuacion_max, id_status)
            VALUES (?, ?, ?, ?, 1)
            """, idRsp, nombre.trim(), fechaEntrega, puntuacion);

        Long newId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Actividad escolar creada con éxito", "id", newId));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateActivity(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String nombre = (String) body.get("nombreActividad");
        String fechaEntrega = (String) body.get("fechaEntrega");
        Object puntuacionObj = body.getOrDefault("puntuacionMax", 20.00);
        Object statusIdObj = body.getOrDefault("idStatus", 1);

        if (nombre == null || fechaEntrega == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nombre y fecha de entrega son requeridos"));
        }

        double puntuacion = Double.parseDouble(puntuacionObj.toString());
        int idStatus = Integer.parseInt(statusIdObj.toString());

        jdbcTemplate.update("""
            UPDATE teleaula_db.actividad 
            SET nombre_actividad = ?, fecha_entrega = ?, puntuacion_max = ?, id_status = ?
            WHERE id = ?
            """, nombre.trim(), fechaEntrega, puntuacion, idStatus, id);

        return ResponseEntity.ok(Map.of("message", "Actividad actualizada correctamente"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteActivity(@PathVariable Long id) {
        int rows = jdbcTemplate.update("DELETE FROM teleaula_db.actividad WHERE id = ?", id);
        if (rows > 0) {
            return ResponseEntity.ok(Map.of("message", "Actividad escolar eliminada con éxito"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Actividad no encontrada"));
    }
}
