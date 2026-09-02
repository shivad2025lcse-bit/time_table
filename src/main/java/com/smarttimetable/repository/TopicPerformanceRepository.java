package com.smarttimetable.repository;

import com.smarttimetable.entity.TopicPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TopicPerformanceRepository extends JpaRepository<TopicPerformance, Long> {
    List<TopicPerformance> findByStudentId(Long studentId);
}
