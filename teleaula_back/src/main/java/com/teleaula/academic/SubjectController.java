package com.teleaula.academic;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final JdbcTemplate jdbcTemplate;

    public SubjectController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllSubjects() {
        String sql = """
            SELECT 
                m.id, 
                m.nombre_materia AS nombreMateria, 
                m.codigo_materia AS codigoMateria, 
                m.creditos,
                COUNT(DISTINCT rsp.id_profesor) AS totalProfesores,
                COUNT(DISTINCT rsp.id_seccion) AS totalSecciones
            FROM teleaula_db.materia m
            LEFT JOIN teleaula_db.r_s_p rsp ON rsp.id_materia = m.id
            GROUP BY m.id, m.nombre_materia, m.codigo_materia, m.creditos
            ORDER BY m.id ASC
            """;
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createSubject(@RequestBody Map<String, Object> body) {
        String nombre = (String) body.get("nombreMateria");
        String codigo = (String) body.get("codigoMateria");
        Object creditosObj = body.getOrDefault("creditos", 3);

        if (nombre == null || codigo == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nombre y código de materia son requeridos"));
        }

        Integer exists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM teleaula_db.materia WHERE LOWER(codigo_materia) = LOWER(?)", 
            Integer.class, codigo.trim()
        );
        if (exists != null && exists > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Ya existe una materia con ese código"));
        }

        int creditos = Integer.parseInt(creditosObj.toString());
        jdbcTemplate.update(
            "INSERT INTO teleaula_db.materia (nombre_materia, codigo_materia, creditos) VALUES (?, ?, ?)",
            nombre.trim(), codigo.trim().toUpperCase(), creditos
        );
        Long id = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Materia registrada con éxito", "id", id));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> updateSubject(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String nombre = (String) body.get("nombreMateria");
        String codigo = (String) body.get("codigoMateria");
        Object creditosObj = body.getOrDefault("creditos", 3);

        if (nombre == null || codigo == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nombre y código son requeridos"));
        }

        Integer exists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM teleaula_db.materia WHERE LOWER(codigo_materia) = LOWER(?) AND id <> ?", 
            Integer.class, codigo.trim(), id
        );
        if (exists != null && exists > 0) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "El código ya pertenece a otra materia"));
        }

        int creditos = Integer.parseInt(creditosObj.toString());
        jdbcTemplate.update(
            "UPDATE teleaula_db.materia SET nombre_materia = ?, codigo_materia = ?, creditos = ? WHERE id = ?",
            nombre.trim(), codigo.trim().toUpperCase(), creditos, id
        );

        return ResponseEntity.ok(Map.of("message", "Materia actualizada correctamente"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteSubject(@PathVariable Long id) {
        int rows = jdbcTemplate.update("DELETE FROM teleaula_db.materia WHERE id = ?", id);
        if (rows > 0) {
            return ResponseEntity.ok(Map.of("message", "Materia eliminada con éxito"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Materia no encontrada"));
    }
}
