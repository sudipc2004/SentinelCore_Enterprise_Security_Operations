package com.sentinelcore.repository;

import com.sentinelcore.model.ThreatIntel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ThreatIntelRepository extends MongoRepository<ThreatIntel, String> {
    boolean existsByTypeAndValue(String type, String value);
}
