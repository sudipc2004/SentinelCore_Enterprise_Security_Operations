package com.sentinelcore.controller;

import com.sentinelcore.model.Asset;
import com.sentinelcore.repository.AssetRepository;
import com.sentinelcore.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<?> getAllAssets() {
        List<Asset> assets = assetRepository.findAll();
        return ResponseEntity.ok(assets);
    }

    @PostMapping
    public ResponseEntity<?> addOrUpdateAsset(@RequestBody Asset asset, @AuthenticationPrincipal com.sentinelcore.model.User principal) {
        String userEmail = principal != null ? principal.getEmail() : "anonymous@sentinelcore.in";
        asset.setLastSeen(Instant.now());
        boolean isNew = asset.getId() == null;
        Asset saved = assetRepository.save(asset);

        auditLogService.log(
                userEmail,
                isNew ? "ASSET_CREATE" : "ASSET_UPDATE",
                "ASSETS",
                "127.0.0.1",
                (isNew ? "Registered new asset: " : "Updated asset: ") + saved.getName() + " (" + saved.getIpAddress() + ")"
        );

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAsset(@PathVariable String id, @AuthenticationPrincipal com.sentinelcore.model.User principal) {
        String userEmail = principal != null ? principal.getEmail() : "anonymous@sentinelcore.in";
        Optional<Asset> assetOpt = assetRepository.findById(id);
        if (assetOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        assetRepository.deleteById(id);
        auditLogService.log(
                userEmail,
                "ASSET_DELETE",
                "ASSETS",
                "127.0.0.1",
                "Deleted asset: " + assetOpt.get().getName()
        );

        return ResponseEntity.ok().build();
    }
}
