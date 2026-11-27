package com.smarttimetable.repository;

import com.smarttimetable.entity.FacultyLeave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyLeaveRepository extends JpaRepository<FacultyLeave, Long> {
    List<FacultyLeave> findByDate(LocalDate date);
    Optional<FacultyLeave> findByDateAndTeacherId(LocalDate date, Long teacherId);
}
