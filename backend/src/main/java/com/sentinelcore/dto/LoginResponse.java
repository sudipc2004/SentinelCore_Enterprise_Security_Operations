package com.sentinelcore.dto;

import com.sentinelcore.model.Role;

import java.time.Instant;

public class LoginResponse {
    private String token;
    private String id;
    private String name;
    private String email;
    private Role role;
    private String department;
    private String status;
    private Instant createdAt;

    public LoginResponse() {}

    public LoginResponse(String token, String id, String name, String email, Role role, String department, String status, Instant createdAt) {
        this.token = token;
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.department = department;
        this.status = status;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
