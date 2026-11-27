package com.smarttimetable.repository;

import com.smarttimetable.entity.TemporaryChangeStatus;
import com.smarttimetable.entity.TemporaryTimetableChange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TemporaryTimetableChangeRepository extends JpaRepository<TemporaryTimetableChange, Long> {

    List<TemporaryTimetableChange> findAllByOrderByStartDateDescPeriodNumberAscIdDesc();

    List<TemporaryTimetableChange> findBySectionIdOrderByStartDateDescPeriodNumberAsc(Long sectionId);

    List<TemporaryTimetableChange> findByStatusOrderByStartDateAscPeriodNumberAsc(TemporaryChangeStatus status);

    @Query("SELECT t FROM TemporaryTimetableChange t WHERE t.status = :status " +
           "AND t.startDate <= :targetDate AND t.endDate >= :targetDate " +
           "ORDER BY t.periodNumber ASC, t.id ASC")
    List<TemporaryTimetableChange> findActiveForDate(
            @Param("status") TemporaryChangeStatus status,
            @Param("targetDate") LocalDate targetDate);

    @Query("SELECT t FROM TemporaryTimetableChange t WHERE t.section.id = :sectionId " +
           "AND t.status = :status AND t.startDate <= :targetDate AND t.endDate >= :targetDate " +
           "ORDER BY t.periodNumber ASC, t.id ASC")
    List<TemporaryTimetableChange> findActiveBySectionAndDate(
            @Param("sectionId") Long sectionId,
            @Param("status") TemporaryChangeStatus status,
            @Param("targetDate") LocalDate targetDate);

    @Query("SELECT t FROM TemporaryTimetableChange t WHERE t.section.id = :sectionId " +
           "AND t.status = :status AND t.endDate >= :fromDate " +
           "ORDER BY t.startDate ASC, t.periodNumber ASC")
    List<TemporaryTimetableChange> findUpcomingBySection(
            @Param("sectionId") Long sectionId,
            @Param("status") TemporaryChangeStatus status,
            @Param("fromDate") LocalDate fromDate);

    @Query("SELECT t FROM TemporaryTimetableChange t WHERE t.status = 'PUBLISHED' AND t.endDate < :today")
    List<TemporaryTimetableChange> findExpiredPublished(@Param("today") LocalDate today);

    @Query("SELECT t FROM TemporaryTimetableChange t WHERE t.section.id = :sectionId " +
           "AND t.periodNumber = :periodNumber " +
           "AND t.status IN :blockingStatuses " +
           "AND t.startDate <= :endDate AND t.endDate >= :startDate")
    List<TemporaryTimetableChange> findOverlappingForSectionAndPeriod(
            @Param("sectionId") Long sectionId,
            @Param("periodNumber") Integer periodNumber,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("blockingStatuses") List<TemporaryChangeStatus> blockingStatuses);

    @Query("SELECT t FROM TemporaryTimetableChange t WHERE t.periodNumber = :periodNumber " +
           "AND t.status = 'PUBLISHED' AND t.startDate <= :endDate AND t.endDate >= :startDate")
    List<TemporaryTimetableChange> findPublishedOverlappingForPeriod(
            @Param("periodNumber") Integer periodNumber,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
}
