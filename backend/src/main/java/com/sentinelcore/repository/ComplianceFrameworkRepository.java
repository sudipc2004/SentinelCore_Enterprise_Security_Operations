package com.sentinelcore.repository;

import com.sentinelcore.model.ComplianceFramework;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComplianceFrameworkRepository extends MongoRepository<ComplianceFramework, String> {
    Optional<ComplianceFramework> findByFrameworkId(String frameworkId);
}
