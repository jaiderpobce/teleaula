package com.teleaula.academic;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/academic-loads")
public class AcademicLoadController {

    private final JdbcTemplate jdbcTemplate;

    public AcademicLoadController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllLoads() {
        String sql = """
            SELECT 
                rsp.id,
                rsp.id_seccion AS idSeccion,
                s.numero_seccion AS numeroSeccion,
                rsp.id_materia AS idMateria,
                m.nombre_materia AS nombreMateria,
                m.codigo_materia AS codigoMateria,
                rsp.id_profesor AS idProfesor,
                p.nombre_completo AS nombreProfesor,
                rsp.semestre,
                COUNT(DISTINCT act.id) AS totalActividades
            FROM teleaula_db.r_s_p rsp
            JOIN teleaula_db.seccion s ON s.id = rsp.id_seccion
            JOIN teleaula_db.materia m ON m.id = rsp.id_materia
            JOIN teleaula_db.profesor p ON p.id = rsp.id_profesor
            LEFT JOIN teleaula_db.actividad act ON act.id_r_s_p = rsp.id
            GROUP BY rsp.id, rsp.id_seccion, s.numero_seccion, rsp.id_materia, m.nombre_materia, m.codigo_materia, rsp.id_profesor, p.nombre_completo, rsp.semestre
            ORDER BY s.numero_seccion ASC, m.nombre_materia ASC
            """;
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createLoad(@RequestBody Map<String, Object> body) {
        Object seccionIdObj = body.get("idSeccion");
        Object materiaIdObj = body.get("idMateria");
        Object profesorIdObj = body.get("idProfesor");
        String semestre = (String) body.getOrDefault("semestre", "2026-I");

        if (seccionIdObj == null || materiaIdObj == null || profesorIdObj == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Sección, materia y profesor son obligatorios"));
        }

        Long idSeccion = Long.valueOf(seccionIdObj.toString());
        Long idMateria = Long.valueOf(materiaIdObj.toString());
        Long idProfesor = Long.valueOf(profesorIdObj.toString());

        jdbcTemplate.update(
            "INSERT INTO teleaula_db.r_s_p (id_seccion, id_materia, id_profesor, semestre) VALUES (?, ?, ?, ?)",
            idSeccion, idMateria, idProfesor, semestre.trim()
        );
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Carga académica asignada con éxito", "id", id));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteLoad(@PathVariable Long id) {
        int rows = jdbcTemplate.update("DELETE FROM teleaula_db.r_s_p WHERE id = ?", id);
        if (rows > 0) {
            return ResponseEntity.ok(Map.of("message", "Carga académica removida con éxito"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Registro no encontrado"));
    }
}
