package com.sentinelcore.repository;

import com.sentinelcore.model.ThreatIOC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThreatIOCRepository extends MongoRepository<ThreatIOC, String> {
    boolean existsByTypeAndValue(String type, String value);
    Page<ThreatIOC> findByType(String type, Pageable pageable);
    Page<ThreatIOC> findByValueContainingIgnoreCaseOrDescriptionContainingIgnoreCase(String value, String description, Pageable pageable);
    long countByRiskScoreGreaterThanEqual(double threshold);
}
