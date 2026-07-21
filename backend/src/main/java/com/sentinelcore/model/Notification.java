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
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    
    private String type; // "NEW_CRITICAL_CVE", "PATCH_AVAILABLE", "OVERDUE_REMEDIATION", "FAILED_SCAN", "HIGH_RISK_ASSET"
    private String title;
    private String message;
    private boolean isRead;
    private LocalDateTime createdAt;
}
