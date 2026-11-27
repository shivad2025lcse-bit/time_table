package com.smarttimetable.repository;

import com.smarttimetable.entity.EmailNotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface EmailNotificationLogRepository extends JpaRepository<EmailNotificationLog, Long> {
    boolean existsByTemporaryChangeIdAndEmailIgnoreCaseAndEventTypeAndChangeRevisionAndNotificationStatusIn(
            Long temporaryChangeId,
            String email,
            String eventType,
            Integer changeRevision,
            Collection<String> statuses);

    List<EmailNotificationLog> findTop250ByOrderBySentAtDesc();
    List<EmailNotificationLog> findByTemporaryChangeIdOrderBySentAtDesc(Long temporaryChangeId);
    List<EmailNotificationLog> findByUserId(Long userId);
    long countByNotificationStatusIn(Collection<String> statuses);
    long countByNotificationStatus(String notificationStatus);
}
