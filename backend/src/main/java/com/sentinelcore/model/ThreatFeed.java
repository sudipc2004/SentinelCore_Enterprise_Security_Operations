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
@Document(collection = "threat_feeds")
public class ThreatFeed {
    @Id
    private String id;
    
    private String name; // "VirusTotal", "AlienVault OTX", "AbuseIPDB", "PhishTank", "CIRCL CVE", "MISP"
    private String url;
    private boolean enabled;
    private String status; // "ACTIVE", "INACTIVE", "ERROR"
    private LocalDateTime lastSync;
    private int syncIntervalMinutes;
}
