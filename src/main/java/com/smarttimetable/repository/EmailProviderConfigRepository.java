package com.smarttimetable.repository;

import com.smarttimetable.entity.EmailProviderConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailProviderConfigRepository extends JpaRepository<EmailProviderConfig, Long> {
    Optional<EmailProviderConfig> findTopByOrderByIdDesc();
}
