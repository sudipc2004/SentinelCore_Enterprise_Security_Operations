package com.sentinelcore.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private Instant timestamp = Instant.now();
    private String userEmail;
    private String action;
    private String module;
    private String ipAddress;
    
    @Column(length = 1000)
    private String description;

    public AuditLog() {}

    public AuditLog(String id, Instant timestamp, String userEmail, String action, String module, String ipAddress, String description) {
        this.id = id;
        this.timestamp = timestamp;
        this.userEmail = userEmail;
        this.action = action;
        this.module = module;
        this.ipAddress = ipAddress;
        this.description = description;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
