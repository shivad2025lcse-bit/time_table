package com.smarttimetable.controller;

import com.smarttimetable.entity.ClassDocument;
import com.smarttimetable.entity.Student;
import com.smarttimetable.entity.User;
import com.smarttimetable.repository.ClassDocumentRepository;
import com.smarttimetable.repository.StudentRepository;
import com.smarttimetable.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/class-documents")
@CrossOrigin(origins = "*")
public class ClassDocumentController {

    @Autowired
    private ClassDocumentRepository classDocumentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @PostMapping("/publish")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<?> publishDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sectionName") String sectionName,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "note", required = false) String note,
            @RequestParam(value = "publishedBy", required = false) String publishedBy) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please select a PDF or image file."));
            }
            String cleanSection = sectionName != null ? sectionName.trim().replaceAll("\\s+", " ") : "";
            if (cleanSection.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Target class section is required."));
            }

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
            String lowerName = originalName.toLowerCase();
            String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";

            boolean isPdf = contentType.contains("pdf") || lowerName.endsWith(".pdf");
            boolean isImage = contentType.startsWith("image/")
                    || lowerName.endsWith(".png") || lowerName.endsWith(".jpg")
                    || lowerName.endsWith(".jpeg") || lowerName.endsWith(".webp") || lowerName.endsWith(".gif");

            if (!isPdf && !isImage) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only PDF and image files (.pdf, .png, .jpg, .webp) are supported."));
            }

            String effectiveContentType = isPdf
                    ? "application/pdf"
                    : (contentType.startsWith("image/") ? contentType : "image/png");

            ClassDocument doc = new ClassDocument();
            doc.setSectionName(cleanSection);
            doc.setTitle(title != null && !title.trim().isEmpty() ? title.trim() : originalName);
            doc.setNote(note != null ? note.trim() : "");
            doc.setFileName(originalName);
            doc.setContentType(effectiveContentType);
            doc.setFileData(file.getBytes());
            doc.setPublishedBy(publishedBy != null ? publishedBy.trim() : "Class Advisor");
            doc.setCreatedAt(LocalDateTime.now());

            ClassDocument saved = classDocumentRepository.save(doc);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to publish file."));
        }
    }

    @GetMapping
    public ResponseEntity<List<ClassDocument>> listDocuments(
            @RequestParam(value = "section", required = false) String section,
            Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        boolean isStudent = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));

        if (isStudent) {
            User user = userRepository.findByUsername(authentication.getName()).orElse(null);
            if (user == null) return ResponseEntity.ok(Collections.emptyList());
            Student student = studentRepository.findByUserId(user.getId()).orElse(null);
            if (student == null || student.getSection() == null || student.getSection().getSectionName() == null) {
                return ResponseEntity.ok(Collections.emptyList());
            }
            String studentSection = student.getSection().getSectionName().trim().replaceAll("\\s+", " ");
            return ResponseEntity.ok(classDocumentRepository.findBySectionNameIgnoreCaseOrderByCreatedAtDesc(studentSection));
        }

        if (section == null || section.trim().isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        String cleanSection = section.trim().replaceAll("\\s+", " ");
        return ResponseEntity.ok(classDocumentRepository.findBySectionNameIgnoreCaseOrderByCreatedAtDesc(cleanSection));
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> viewDocumentFile(@PathVariable Long id, Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).build();
        }
        ClassDocument doc = classDocumentRepository.findById(id).orElse(null);
        if (doc == null) {
            return ResponseEntity.notFound().build();
        }

        boolean isStudent = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
        if (isStudent) {
            User user = userRepository.findByUsername(authentication.getName()).orElse(null);
            Student student = (user != null) ? studentRepository.findByUserId(user.getId()).orElse(null) : null;
            String studentSec = (student != null && student.getSection() != null && student.getSection().getSectionName() != null)
                    ? student.getSection().getSectionName().trim().replaceAll("\\s+", " ")
                    : "";
            if (!studentSec.equalsIgnoreCase(doc.getSectionName())) {
                return ResponseEntity.status(403).build();
            }
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(doc.getContentType()));
        headers.setContentDisposition(ContentDisposition.inline().filename(doc.getFileName()).build());
        return ResponseEntity.ok().headers(headers).body(doc.getFileData());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_FACULTY')")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        if (!classDocumentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        classDocumentRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("deleted", true));
    }
}
