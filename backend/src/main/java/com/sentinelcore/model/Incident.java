package com.sentinelcore.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "incidents")
public class Incident {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String incidentId; // Format e.g., INC-10293
    private String title;
    
    @Column(length = 2000)
    private String description;
    
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    private String status; // NEW, ASSIGNED, INVESTIGATING, RESOLVED, CLOSED
    private String analystEmail;
    private double riskScore;
    private Instant createdAt;
    private Instant updatedAt;
    
    @Column(length = 2000)
    private String resolutionNotes;

    public Incident() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        this.status = "NEW";
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getIncidentId() { return incidentId; }
    public void setIncidentId(String incidentId) { this.incidentId = incidentId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAnalystEmail() { return analystEmail; }
    public void setAnalystEmail(String analystEmail) { this.analystEmail = analystEmail; }
    public double getRiskScore() { return riskScore; }
    public void setRiskScore(double riskScore) { this.riskScore = riskScore; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
}
