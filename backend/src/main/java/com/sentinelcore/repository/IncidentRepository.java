package com.sentinelcore.repository;

import com.sentinelcore.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, String> {
    List<Incident> findByStatus(String status);
    List<Incident> findByAnalystEmail(String analystEmail);
    long countByStatus(String status);
}
