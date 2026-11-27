package com.smarttimetable.repository;

import com.smarttimetable.entity.EmailSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmailSubscriptionRepository extends JpaRepository<EmailSubscription, Long> {
    Optional<EmailSubscription> findByUserId(Long userId);
    Optional<EmailSubscription> findByUserUsernameIgnoreCase(String username);
    List<EmailSubscription> findByVerifiedTrueAndNotificationsEnabledTrue();
}
