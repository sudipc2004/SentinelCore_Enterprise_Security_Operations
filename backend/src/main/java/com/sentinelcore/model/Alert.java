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
@Document(collection = "alerts")
public class Alert {
    @Id
    private String id;
    
    private String title;
    private String description;
    
    // CRITICAL, HIGH, MEDIUM, LOW
    private String severity;
    
    // NEW, INVESTIGATING, RESOLVED, FALSE_POSITIVE
    private String status;
    
    private String sourceIp;
    private String relatedAssetId;
    
    private List<String> sourceLogIds;
    
    private String incidentId;
    
    private LocalDateTime timestamp;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
