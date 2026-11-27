package com.smarttimetable.entity;

/**
 * Lifecycle state of a temporary timetable change record.
 */
public enum TemporaryChangeStatus {
    DRAFT,
    PENDING_APPROVAL,
    PUBLISHED,
    CANCELLED,
    EXPIRED,
    REJECTED
}
