package com.sentinelcore.repository;

import com.sentinelcore.model.SecurityLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SecurityLogRepository extends MongoRepository<SecurityLog, String> {
    long countByAnomaly(boolean anomaly);
}
