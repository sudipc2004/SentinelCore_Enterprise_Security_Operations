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
@Document(collection = "analyst_notes")
public class AnalystNote {
    @Id
    private String id;
    
    private String targetId; // Reference to ThreatIOC id or Vulnerability id
    private String targetType; // "IOC", "VULNERABILITY"
    private String authorEmail;
    private String authorName;
    private String content;
    private LocalDateTime createdAt;
}
