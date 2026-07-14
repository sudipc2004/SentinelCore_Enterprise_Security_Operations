package com.sentinelcore.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "security_logs")
public class SecurityLog {
    @Id
    private String id;

    private LocalDateTime timestamp;
    private String systemType;
    private String ipAddress;
    private Integer port;
    private String protocol;
    private String userEmail;
    private String device;
    private String country;
    private Long bytes;
    private boolean anomaly;
    private Double confidenceScore;
    private Double riskScore;
    private String rawMessage;
    private String relatedAssetId;
    private String ownerTeamId;
    private LocalDateTime createdAt;
}
