package com.sentinelcore.repository;

import com.sentinelcore.model.Patch;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatchRepository extends MongoRepository<Patch, String> {
    List<Patch> findByCveId(String cveId);
    List<Patch> findByStatus(String status);
}
