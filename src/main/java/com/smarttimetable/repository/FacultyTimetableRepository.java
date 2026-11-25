package com.smarttimetable.repository;

import com.smarttimetable.entity.FacultyTimetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FacultyTimetableRepository extends JpaRepository<FacultyTimetable, Long> {
    Optional<FacultyTimetable> findByUsernameIgnoreCase(String username);
}

