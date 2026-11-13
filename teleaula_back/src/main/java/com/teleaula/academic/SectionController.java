package com.teleaula.academic;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sections")
public class SectionController {

    private final JdbcTemplate jdbcTemplate;

    public SectionController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllSections() {
        String sql = """
            SELECT 
                s.id, 
                s.numero_seccion AS numeroSeccion, 
                s.capacidad,
                COUNT(DISTINCT i.id_alumno) AS alumnosInscritos,
                COUNT(DISTINCT rsp.id_materia) AS materiasAsignadas
            FROM teleaula_db.seccion s
            LEFT JOIN teleaula_db.inscripcion i ON i.id_seccion = s.id
            LEFT JOIN teleaula_db.r_s_p rsp ON rsp.id_seccion = s.id
            GROUP BY s.id, s.numero_seccion, s.capacidad
            ORDER BY s.id ASC
            """;
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createSection(@RequestBody Map<String, Object> body) {
        String numero = (String) body.get("numeroSeccion");
        Object capacidadObj = body.getOrDefault("capacidad", 35);

        if (numero == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "El número o identificador de sección es requerido"));
        }

        int capacidad = Integer.parseInt(capacidadObj.toString());
        jdbcTemplate.update(
            "INSERT INTO teleaula_db.seccion (numero_seccion, capacidad) VALUES (?, ?)",
            numero.trim().toUpperCase(), capacidad
        );
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Sección creada con éxito", "id", id));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateSection(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String numero = (String) body.get("numeroSeccion");
        Object capacidadObj = body.getOrDefault("capacidad", 35);

        if (numero == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "El número o identificador de sección es requerido"));
        }

        int capacidad = Integer.parseInt(capacidadObj.toString());
        jdbcTemplate.update(
            "UPDATE teleaula_db.seccion SET numero_seccion = ?, capacidad = ? WHERE id = ?",
            numero.trim().toUpperCase(), capacidad, id
        );

        return ResponseEntity.ok(Map.of("message", "Sección actualizada correctamente"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteSection(@PathVariable Long id) {
        int rows = jdbcTemplate.update("DELETE FROM teleaula_db.seccion WHERE id = ?", id);
        if (rows > 0) {
            return ResponseEntity.ok(Map.of("message", "Sección eliminada con éxito"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Sección no encontrada"));
    }
}
