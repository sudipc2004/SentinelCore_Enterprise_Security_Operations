package com.sentinelcore.repository;

import com.sentinelcore.model.IOCEnrichment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IOCEnrichmentRepository extends MongoRepository<IOCEnrichment, String> {
    Optional<IOCEnrichment> findByIocId(String iocId);
}
