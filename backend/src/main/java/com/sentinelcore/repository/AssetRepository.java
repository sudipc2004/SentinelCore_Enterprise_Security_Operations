package com.sentinelcore.repository;

import com.sentinelcore.model.Asset;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AssetRepository extends MongoRepository<Asset, String> {
    Optional<Asset> findByIpAddress(String ipAddress);
    boolean existsByIpAddress(String ipAddress);
    long countByStatus(String status);
}
