package com.smarttimetable.repository;

import com.smarttimetable.entity.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, Long> {
    List<StudentAnswer> findBySubmissionId(Long submissionId);
    
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM student_answers WHERE question_id IN (SELECT id FROM quiz_questions WHERE quiz_id = :quizId)", nativeQuery = true)
    void deleteByQuizId(@org.springframework.data.repository.query.Param("quizId") Long quizId);
}
