package com.sentinelcore.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "threat_intel")
public class ThreatIntel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String type; // IP, DOMAIN, MALWARE_HASH, URL
    
    @Column(name = "intel_value")
    private String value; // The malicious indicator value (e.g., "192.168.1.100" or "malicious-site.com")
    private String description;
    private String source; // e.g., AlienVault, OTX, Internal
    private Instant createdAt;

    public ThreatIntel() {
        this.createdAt = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
