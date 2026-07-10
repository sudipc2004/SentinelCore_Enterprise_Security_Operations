package com.sentinelcore.repository;

import com.sentinelcore.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetRepository extends JpaRepository<Asset, String> {
    Optional<Asset> findByIpAddress(String ipAddress);
    List<Asset> findByStatus(String status);
}
