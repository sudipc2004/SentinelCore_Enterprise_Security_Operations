package com.sentinelcore.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "threat_iocs")
public class ThreatIOC {
    @Id
    private String id;

    private String type; // "IP", "DOMAIN", "URL", "MD5", "SHA1", "SHA256", "CVE", "EMAIL", "FILE_NAME"
    private String value;
    private String description;
    private String status; // "ACTIVE", "INACTIVE", "UNDER_REVIEW"
    private List<String> tags;
    private double riskScore; // 0 - 100
    private String source;
    private String reviewerTeamId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
