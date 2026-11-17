package com.teleaula.repository;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final JdbcTemplate jdbcTemplate;

    @Value("${teleaula.upload.dir:/app/uploads}")
    private String uploadDir;

    public ResourceController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getResources(
            @RequestParam(required = false) Long activityId) {
        String sql = """
            SELECT 
                r.id,
                r.id_tiporecurso AS idTipoRecurso,
                tr.descripcion_tipo AS tipoRecurso,
                r.tiporecurso AS nombreArchivo,
                r.ubicacion,
                r.id_actividades AS idActividad,
                COALESCE(act.nombre_actividad, 'Repositorio General') AS nombreActividad,
                COALESCE(m.nombre_materia, 'General') AS nombreMateria
            FROM teleaula_db.recursos r
            JOIN teleaula_db.tipo_recursos tr ON tr.id = r.id_tiporecurso
            LEFT JOIN teleaula_db.actividad act ON act.id = r.id_actividades
            LEFT JOIN teleaula_db.r_s_p rsp ON rsp.id = act.id_r_s_p
            LEFT JOIN teleaula_db.materia m ON m.id = rsp.id_materia
            WHERE (? IS NULL OR r.id_actividades = ?)
            ORDER BY r.id DESC
            """;
        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql, activityId, activityId);
        return ResponseEntity.ok(list);
    }

    @GetMapping("/types")
    public ResponseEntity<List<Map<String, Object>>> getResourceTypes() {
        String sql = "SELECT id, descripcion_tipo AS descripcion FROM teleaula_db.tipo_recursos ORDER BY id ASC";
        return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
    }

    @PostMapping("/upload")
    @Transactional
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "idActividad", required = false) Long idActividad,
            @RequestParam(value = "idTipoRecurso", defaultValue = "1") Long idTipoRecurso,
            @RequestParam(value = "nombreRecurso", required = false) String nombreRecurso) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "El archivo no puede estar vacío"));
        }

        try {
            File targetDir = new File(uploadDir);
            if (!targetDir.exists()) {
                targetDir.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String storedFilename = UUID.randomUUID().toString() + extension;
            Path destination = Paths.get(uploadDir, storedFilename);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

            String publicUrl = "/uploads/" + storedFilename;
            String resourceName = (nombreRecurso != null && !nombreRecurso.isBlank()) 
                ? nombreRecurso.trim() 
                : (originalFilename != null ? originalFilename : storedFilename);

            if (resourceName.length() > 255) {
                resourceName = resourceName.substring(0, 255);
            }

            Long finalActivityId = (idActividad != null && idActividad > 0) ? idActividad : null;

            jdbcTemplate.update("""
                INSERT INTO teleaula_db.recursos (id_tiporecurso, tiporecurso, ubicacion, id_actividades)
                VALUES (?, ?, ?, ?)
                """, idTipoRecurso, resourceName, publicUrl, finalActivityId);

            Long newId = jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Archivo subido con éxito",
                "id", newId,
                "url", publicUrl,
                "nombre", resourceName
            ));

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error al procesar y almacenar el archivo: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteResource(@PathVariable Long id) {
        List<String> paths = jdbcTemplate.queryForList(
            "SELECT ubicacion FROM teleaula_db.recursos WHERE id = ?", String.class, id
        );

        if (paths.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Recurso no encontrado"));
        }

        String location = paths.get(0);
        if (location != null && location.startsWith("/uploads/")) {
            String filename = location.replace("/uploads/", "");
            Path fileToDelete = Paths.get(uploadDir, filename);
            try {
                Files.deleteIfExists(fileToDelete);
            } catch (IOException ignored) {}
        }

        jdbcTemplate.update("DELETE FROM teleaula_db.recursos WHERE id = ?", id);
        return ResponseEntity.ok(Map.of("message", "Recurso eliminado correctamente"));
    }
}
