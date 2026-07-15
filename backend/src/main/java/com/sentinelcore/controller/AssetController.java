package com.sentinelcore.controller;

import com.sentinelcore.model.Asset;
import com.sentinelcore.security.UserPrincipal;
import com.sentinelcore.service.AssetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    @Autowired
    private AssetService assetService;

    @GetMapping
    public ResponseEntity<?> getAssets() {
        return ResponseEntity.ok(assetService.getAssets());
    }

    @PostMapping
    public ResponseEntity<Asset> saveAsset(
            @RequestBody Asset request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(assetService.saveAsset(request, userPrincipal.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAsset(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        assetService.deleteAsset(id, userPrincipal.getUsername());
        return ResponseEntity.ok("Asset deleted successfully.");
    }

    @PostMapping("/import")
    public ResponseEntity<?> importAssets(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        int imported = assetService.importAssets(file, userPrincipal.getUsername());
        return ResponseEntity.ok(Map.of("message", "Imported " + imported + " assets."));
    }
}
