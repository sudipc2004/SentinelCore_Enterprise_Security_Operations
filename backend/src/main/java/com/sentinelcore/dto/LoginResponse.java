package com.sentinelcore.dto;

import com.sentinelcore.model.Role;
import java.time.LocalDateTime;

public class LoginResponse {
    private String token;
    private String id;
    private String name;
    private String email;
    private Role role;
    private String department;
    private String status;
    private LocalDateTime createdAt;

    public LoginResponse() {}

    public LoginResponse(String token, String id, String name, String email, String role, String department) {
        this.token = token;
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = Role.valueOf(role);
        this.department = department;
    }

    public LoginResponse(String token, String id, String name, String email, Role role, String department, String status, LocalDateTime createdAt) {
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
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static LoginResponseBuilder builder() {
        return new LoginResponseBuilder();
    }

    public static class LoginResponseBuilder {
        private String token;
        private String id;
        private String name;
        private String email;
        private Role role;
        private String department;
        private String status;
        private LocalDateTime createdAt;

        public LoginResponseBuilder token(String token) { this.token = token; return this; }
        public LoginResponseBuilder id(String id) { this.id = id; return this; }
        public LoginResponseBuilder name(String name) { this.name = name; return this; }
        public LoginResponseBuilder email(String email) { this.email = email; return this; }
        public LoginResponseBuilder role(Role role) { this.role = role; return this; }
        public LoginResponseBuilder department(String department) { this.department = department; return this; }
        public LoginResponseBuilder status(String status) { this.status = status; return this; }
        public LoginResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public LoginResponse build() {
            return new LoginResponse(token, id, name, email, role, department, status, createdAt);
        }
    }
}
