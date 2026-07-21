package com.sentinelcore.repository;

import com.sentinelcore.model.ThreatActor;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ThreatActorRepository extends MongoRepository<ThreatActor, String> {
    Optional<ThreatActor> findByNameIgnoreCase(String name);
}
