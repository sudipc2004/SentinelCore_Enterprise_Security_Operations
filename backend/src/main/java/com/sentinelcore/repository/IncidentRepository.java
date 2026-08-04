package com.sentinelcore.repository;

import com.sentinelcore.model.Incident;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IncidentRepository extends MongoRepository<Incident, String> {
    long countByStatus(String status);
    long countByAssignedTeam(String assignedTeam);
}
