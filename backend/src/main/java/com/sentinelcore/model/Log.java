package com.sentinelcore.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "logs")
public class Log {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private Instant timestamp;
    private String ipAddress;
    private String protocol;
    private Integer port;
    private Long bytes;
    private Integer failedLoginCount;
    private Integer requestFrequency;
    private String country;
    private String userEmail;
    private String device;
    private String systemType; // WINDOWS, LINUX, APACHE, NGINX, FIREWALL, ROUTER, IDS, ENDPOINT
    
    @Column(length = 2000)
    private String rawMessage;
    
    private boolean isAnomaly;
    private double confidenceScore;
    private double riskScore;

    public Log() {
        this.timestamp = Instant.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getProtocol() { return protocol; }
    public void setProtocol(String protocol) { this.protocol = protocol; }
    public Integer getPort() { return port; }
    public void setPort(Integer port) { this.port = port; }
    public Long getBytes() { return bytes; }
    public void setBytes(Long bytes) { this.bytes = bytes; }
    public Integer getFailedLoginCount() { return failedLoginCount; }
    public void setFailedLoginCount(Integer failedLoginCount) { this.failedLoginCount = failedLoginCount; }
    public Integer getRequestFrequency() { return requestFrequency; }
    public void setRequestFrequency(Integer requestFrequency) { this.requestFrequency = requestFrequency; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getDevice() { return device; }
    public void setDevice(String device) { this.device = device; }
    public String getSystemType() { return systemType; }
    public void setSystemType(String systemType) { this.systemType = systemType; }
    public String getRawMessage() { return rawMessage; }
    public void setRawMessage(String rawMessage) { this.rawMessage = rawMessage; }
    public boolean isAnomaly() { return isAnomaly; }
    public void setAnomaly(boolean anomaly) { isAnomaly = anomaly; }
    public double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(double confidenceScore) { this.confidenceScore = confidenceScore; }
    public double getRiskScore() { return riskScore; }
    public void setRiskScore(double riskScore) { this.riskScore = riskScore; }
}
