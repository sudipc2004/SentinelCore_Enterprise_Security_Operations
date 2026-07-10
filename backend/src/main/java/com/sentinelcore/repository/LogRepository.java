package com.sentinelcore.repository;

import com.sentinelcore.model.Log;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LogRepository extends JpaRepository<Log, String> {
    List<Log> findBySystemType(String systemType);
    List<Log> findByIsAnomalyTrue();
    long countByIsAnomalyTrue();
}
