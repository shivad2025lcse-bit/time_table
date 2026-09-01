package com.smarttimetable.repository;

import com.smarttimetable.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findBySectionId(Long sectionId);
    List<Quiz> findByTeacherId(Long teacherId);
}
