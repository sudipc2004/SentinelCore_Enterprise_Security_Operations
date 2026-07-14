package com.sentinelcore.service;

import com.sentinelcore.exception.BadRequestException;
import com.sentinelcore.exception.ResourceNotFoundException;
import com.sentinelcore.model.Asset;
import com.sentinelcore.repository.AssetRepository;
import com.sentinelcore.repository.TeamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AssetService {

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private AuditLogService auditLogService;

    public List<Asset> getAssets() {
        return assetRepository.findAll();
    }

    public Asset saveAsset(Asset request, String currentUserEmail) {
        validateAsset(request);

        Asset asset = null;
        if (StringUtils.hasText(request.getId())) {
            asset = assetRepository.findById(request.getId()).orElse(null);
        }
        if (asset == null && StringUtils.hasText(request.getIpAddress())) {
            asset = assetRepository.findByIpAddress(request.getIpAddress()).orElse(null);
        }

        LocalDateTime now = LocalDateTime.now();
        if (asset == null) {
            asset = Asset.builder()
                    .createdAt(now)
                    .build();
        }

        asset.setName(request.getName());
        asset.setType(request.getType());
        asset.setIpAddress(request.getIpAddress());
        asset.setMacAddress(request.getMacAddress());
        asset.setOs(request.getOs());
        asset.setCriticality(defaultValue(request.getCriticality(), "MEDIUM"));
        asset.setStatus(defaultValue(request.getStatus(), "ONLINE"));
        asset.setOwnerTeamId(request.getOwnerTeamId());
        asset.setLastSeen(request.getLastSeen() == null ? now : request.getLastSeen());
        asset.setUpdatedAt(now);

        Asset saved = assetRepository.save(asset);
        auditLogService.log(null, currentUserEmail, "ASSET_SAVED", "ASSET",
                "Saved asset: " + saved.getName() + " (" + saved.getIpAddress() + ")");
        return saved;
    }

    public void deleteAsset(String id, String currentUserEmail) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + id));
        assetRepository.delete(asset);
        auditLogService.log(null, currentUserEmail, "ASSET_DELETED", "ASSET",
                "Deleted asset: " + asset.getName());
    }

    public int importAssets(MultipartFile file, String currentUserEmail) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("CSV file is required.");
        }

        List<Asset> imported = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean firstLine = true;
            while ((line = reader.readLine()) != null) {
                if (!StringUtils.hasText(line)) {
                    continue;
                }
                if (firstLine && line.toLowerCase().contains("ipaddress")) {
                    firstLine = false;
                    continue;
                }
                firstLine = false;

                String[] columns = line.split(",", -1);
                if (columns.length < 7) {
                    throw new BadRequestException("CSV rows must contain name,type,ipAddress,macAddress,os,criticality,status.");
                }

                Asset asset = Asset.builder()
                        .name(columns[0].trim())
                        .type(columns[1].trim())
                        .ipAddress(columns[2].trim())
                        .macAddress(columns[3].trim())
                        .os(columns[4].trim())
                        .criticality(columns[5].trim())
                        .status(columns[6].trim())
                        .build();
                imported.add(saveAsset(asset, currentUserEmail));
            }
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadRequestException("Could not import assets CSV: " + ex.getMessage());
        }

        return imported.size();
    }

    private void validateAsset(Asset request) {
        if (!StringUtils.hasText(request.getName())) {
            throw new BadRequestException("Asset name is required.");
        }
        if (!StringUtils.hasText(request.getIpAddress())) {
            throw new BadRequestException("Asset IP address is required.");
        }
        if (!StringUtils.hasText(request.getMacAddress())) {
            throw new BadRequestException("Asset MAC address is required.");
        }
        if (StringUtils.hasText(request.getOwnerTeamId()) && !teamRepository.existsById(request.getOwnerTeamId())) {
            throw new ResourceNotFoundException("Owner team not found.");
        }
    }

    private String defaultValue(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }
}
