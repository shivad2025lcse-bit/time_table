package com.smarttimetable.repository;

import com.smarttimetable.entity.TemporaryChangeAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TemporaryChangeAuditLogRepository extends JpaRepository<TemporaryChangeAuditLog, Long> {
    List<TemporaryChangeAuditLog> findByTemporaryChangeIdOrderByCreatedAtDesc(Long temporaryChangeId);
    List<TemporaryChangeAuditLog> findTop200ByOrderByCreatedAtDesc();
}
