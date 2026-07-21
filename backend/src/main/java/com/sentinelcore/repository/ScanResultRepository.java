package com.sentinelcore.repository;

import com.sentinelcore.model.ScanResult;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScanResultRepository extends MongoRepository<ScanResult, String> {
}
