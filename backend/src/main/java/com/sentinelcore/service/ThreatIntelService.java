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
