package com.sentinelcore.repository;

import com.sentinelcore.model.ThreatFeed;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ThreatFeedRepository extends MongoRepository<ThreatFeed, String> {
    Optional<ThreatFeed> findByNameIgnoreCase(String name);
}
