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
@Document(collection = "threat_intel")
public class ThreatIntel {
    @Id
    private String id;

    private String type;
    private String value;
    private String description;
    private String source;
    private String reviewerTeamId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
