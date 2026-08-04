package com.sentinelcore.repository;

import com.sentinelcore.model.Alert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AlertRepository extends MongoRepository<Alert, String> {
    Page<Alert> findByStatus(String status, Pageable pageable);
    Page<Alert> findBySeverity(String severity, Pageable pageable);
    Page<Alert> findByStatusAndSeverity(String status, String severity, Pageable pageable);
}
