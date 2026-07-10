package com.sentinelcore.repository;

import com.sentinelcore.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, String> {
    List<Alert> findBySeverity(String severity);
    List<Alert> findByStatus(String status);
    long countByStatus(String status);
    long countBySeverity(String severity);
}
