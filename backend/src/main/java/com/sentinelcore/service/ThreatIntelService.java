package com.sentinelcore.service;

import com.sentinelcore.exception.BadRequestException;
import com.sentinelcore.exception.ResourceNotFoundException;
import com.sentinelcore.model.ThreatIntel;
import com.sentinelcore.repository.TeamRepository;
import com.sentinelcore.repository.ThreatIntelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ThreatIntelService {

    @Autowired
    private ThreatIntelRepository threatIntelRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private AuditLogService auditLogService;

    public List<ThreatIntel> getIocs() {
        return threatIntelRepository.findAll();
    }

    public ThreatIntel createIoc(ThreatIntel request, String currentUserEmail) {
        validateIoc(request);
        String value = request.getValue().trim();
        String type = request.getType().trim().toUpperCase();

        if (threatIntelRepository.existsByTypeAndValue(type, value)) {
            throw new BadRequestException("IOC already exists.");
        }

        LocalDateTime now = LocalDateTime.now();
        ThreatIntel ioc = ThreatIntel.builder()
                .type(type)
                .value(value)
                .description(request.getDescription())
                .source(StringUtils.hasText(request.getSource()) ? request.getSource() : "Manual")
                .reviewerTeamId(request.getReviewerTeamId())
                .createdAt(now)
                .updatedAt(now)
                .build();

        ThreatIntel saved = threatIntelRepository.save(ioc);
        auditLogService.log(null, currentUserEmail, "IOC_CREATED", "THREAT_INTEL",
                "Created IOC: " + saved.getValue());
        return saved;
    }

    public int uploadIocs(org.springframework.web.multipart.MultipartFile file, String currentUserEmail) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty.");
        }
        int count = 0;
        try (java.io.BufferedReader reader = new java.io.BufferedReader(
                new java.io.InputStreamReader(file.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            boolean isHeader = true;
            while ((line = reader.readLine()) != null) {
                if (!StringUtils.hasText(line)) continue;
                String[] parts = line.split(",");
                if (isHeader && (line.toLowerCase().contains("type") || line.toLowerCase().contains("value"))) {
                    isHeader = false;
                    continue;
                }
                isHeader = false;

                String type = parts.length > 0 ? parts[0].trim().toUpperCase() : "DOMAIN";
                String value = parts.length > 1 ? parts[1].trim() : "";
                String description = parts.length > 2 ? parts[2].trim() : "Bulk ingested Threat Intel IOC";
                String source = parts.length > 3 ? parts[3].trim() : "Bulk File Ingestion";

                if (StringUtils.hasText(value)) {
                    if (!threatIntelRepository.existsByTypeAndValue(type, value)) {
                        ThreatIntel ioc = ThreatIntel.builder()
                                .type(type)
                                .value(value)
                                .description(description)
                                .source(source)
                                .createdAt(LocalDateTime.now())
                                .updatedAt(LocalDateTime.now())
                                .build();
                        threatIntelRepository.save(ioc);
                        count++;
                    }
                }
            }
        } catch (Exception e) {
            throw new BadRequestException("Failed to parse Threat Intel file: " + e.getMessage());
        }

        auditLogService.log(null, currentUserEmail, "THREAT_INTEL_BULK_UPLOAD", "THREAT_INTEL",
                "Bulk ingested " + count + " IOC indicators into Threat Intel");
        return count;
    }

    public void deleteIoc(String id, String currentUserEmail) {
        ThreatIntel ioc = threatIntelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("IOC not found with id: " + id));
        threatIntelRepository.delete(ioc);
        auditLogService.log(null, currentUserEmail, "IOC_DELETED", "THREAT_INTEL",
                "Deleted IOC: " + ioc.getValue());
    }

    private void validateIoc(ThreatIntel request) {
        if (!StringUtils.hasText(request.getType())) {
            throw new BadRequestException("IOC type is required.");
        }
        if (!StringUtils.hasText(request.getValue())) {
            throw new BadRequestException("IOC value is required.");
        }
        if (!StringUtils.hasText(request.getDescription())) {
            throw new BadRequestException("IOC description is required.");
        }
        if (StringUtils.hasText(request.getReviewerTeamId()) && !teamRepository.existsById(request.getReviewerTeamId())) {
            throw new ResourceNotFoundException("Reviewer team not found.");
        }
    }
}
