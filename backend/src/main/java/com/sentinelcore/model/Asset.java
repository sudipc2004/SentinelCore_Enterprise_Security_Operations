package com.sentinelcore.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "assets")
public class Asset {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    private String name;
    private String type; // SERVER, ROUTER, FIREWALL, ENDPOINT, APPLICATION, CLOUD_SERVER
    private String ipAddress;
    private String macAddress;
    private String os;
    private String status; // ONLINE, OFFLINE
    private String criticality; // LOW, MEDIUM, HIGH, CRITICAL
    private Instant lastSeen;

    public Asset() {
        this.lastSeen = Instant.now();
        this.status = "ONLINE";
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getMacAddress() { return macAddress; }
    public void setMacAddress(String macAddress) { this.macAddress = macAddress; }
    public String getOs() { return os; }
    public void setOs(String os) { this.os = os; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCriticality() { return criticality; }
    public void setCriticality(String criticality) { this.criticality = criticality; }
    public Instant getLastSeen() { return lastSeen; }
    public void setLastSeen(Instant lastSeen) { this.lastSeen = lastSeen; }
}
