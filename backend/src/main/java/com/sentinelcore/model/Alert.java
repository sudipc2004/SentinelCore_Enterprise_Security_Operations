package com.sentinelcore.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "alerts")
public class Alert {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String alertId; // Format e.g., ALT-10293
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    private String status; // NEW, INVESTIGATING, RESOLVED, CLOSED
    private double riskScore;
    private String sourceIP;
    private String destinationIP;
    private String userEmail;
    
    @Column(length = 1000)
    private String description;
    
    private Instant timestamp;
    private String logId;

    public Alert() {
        this.timestamp = Instant.now();
        this.status = "NEW";
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAlertId() { return alertId; }
    public void setAlertId(String alertId) { this.alertId = alertId; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public double getRiskScore() { return riskScore; }
    public void setRiskScore(double riskScore) { this.riskScore = riskScore; }
    public String getSourceIP() { return sourceIP; }
    public void setSourceIP(String sourceIP) { this.sourceIP = sourceIP; }
    public String getDestinationIP() { return destinationIP; }
    public void setDestinationIP(String destinationIP) { this.destinationIP = destinationIP; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public String getLogId() { return logId; }
    public void setLogId(String logId) { this.logId = logId; }
}
