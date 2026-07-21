package com.sentinelcore.repository;

import com.sentinelcore.model.RemediationTask;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RemediationTaskRepository extends MongoRepository<RemediationTask, String> {
    List<RemediationTask> findByVulnerabilityId(String vulnerabilityId);
    List<RemediationTask> findByAssignedAnalystEmail(String assignedAnalystEmail);
    List<RemediationTask> findByStatus(String status);
}
