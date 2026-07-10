package com.sentinelcore.repository;

import com.sentinelcore.model.ThreatIntel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ThreatIntelRepository extends JpaRepository<ThreatIntel, String> {
    Optional<ThreatIntel> findByValue(String value);
    boolean existsByValue(String value);
}
