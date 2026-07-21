package com.sentinelcore.repository;

import com.sentinelcore.model.CVE;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CVERepository extends MongoRepository<CVE, String> {
    Optional<CVE> findByCveIdIgnoreCase(String cveId);
    long countBySeverity(String severity);
}
