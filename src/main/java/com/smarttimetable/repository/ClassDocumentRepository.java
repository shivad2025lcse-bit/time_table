package com.smarttimetable.repository;

import com.smarttimetable.entity.ClassDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClassDocumentRepository extends JpaRepository<ClassDocument, Long> {
    List<ClassDocument> findBySectionNameIgnoreCaseOrderByCreatedAtDesc(String sectionName);
}
