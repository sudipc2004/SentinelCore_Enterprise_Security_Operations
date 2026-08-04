package com.sentinelcore.dto;

import com.sentinelcore.model.Alert;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AlertResponse {
    private String id;
    private String title;
    private String message;
    private String description;
    private String ruleId;
    private String category;
    private String source;
    private String severity;
    private String status;
    private String sourceIp;
    private String relatedAssetId;
    private List<String> sourceLogIds;
    private String incidentId;
    private Integer eventCount;
    private LocalDateTime timestamp;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AlertResponse fromAlert(Alert alert) {
        LocalDateTime createdAt = alert.getCreatedAt() != null ? alert.getCreatedAt() : alert.getTimestamp();
        return AlertResponse.builder()
                .id(alert.getId())
                .title(alert.getTitle())
                .message(alert.getDescription())
                .description(alert.getDescription())
                .ruleId(alert.getRuleId())
                .category(alert.getCategory())
                .source(resolveSource(alert))
                .severity(alert.getSeverity())
                .status(toFrontendStatus(alert.getStatus()))
                .sourceIp(alert.getSourceIp())
                .relatedAssetId(alert.getRelatedAssetId())
                .sourceLogIds(alert.getSourceLogIds())
                .incidentId(alert.getIncidentId())
                .eventCount(alert.getEventCount())
                .timestamp(alert.getTimestamp())
                .createdAt(createdAt)
                .updatedAt(alert.getUpdatedAt())
                .build();
    }

    private static String resolveSource(Alert alert) {
        if (alert.getCategory() != null && !alert.getCategory().isBlank()) {
            return alert.getCategory();
        }
        if (alert.getRuleId() != null && !alert.getRuleId().isBlank()) {
            return alert.getRuleId();
        }
        return "Alert Engine";
    }

    private static String toFrontendStatus(String status) {
        if ("NEW".equalsIgnoreCase(status)) {
            return "OPEN";
        }
        if ("INVESTIGATING".equalsIgnoreCase(status)) {
            return "ACKNOWLEDGED";
        }
        if (status == null || status.isBlank()) {
            return "OPEN";
        }
        return status.toUpperCase();
    }
}
