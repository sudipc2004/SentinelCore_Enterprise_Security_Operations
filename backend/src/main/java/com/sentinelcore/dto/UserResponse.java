package com.sentinelcore.dto;

import com.sentinelcore.model.Role;
import com.sentinelcore.model.User;
import java.time.LocalDateTime;

public class UserResponse {
    private String id;
    private String name;
    private String email;
    private Role role;
    private String department;
    private String status;
    private LocalDateTime lastLogin;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public UserResponse() {}

    public UserResponse(String id, String name, String email, Role role, String department, String status, LocalDateTime lastLogin, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.department = department;
        this.status = status;
        this.lastLogin = lastLogin;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
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
    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public static UserResponse fromUser(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .department(user.getDepartment())
                .status(user.getStatus())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    // Builder
    public static UserResponseBuilder builder() {
        return new UserResponseBuilder();
    }

    public static class UserResponseBuilder {
        private String id;
        private String name;
        private String email;
        private Role role;
        private String department;
        private String status;
        private LocalDateTime lastLogin;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public UserResponseBuilder id(String id) { this.id = id; return this; }
        public UserResponseBuilder name(String name) { this.name = name; return this; }
        public UserResponseBuilder email(String email) { this.email = email; return this; }
        public UserResponseBuilder role(Role role) { this.role = role; return this; }
        public UserResponseBuilder department(String department) { this.department = department; return this; }
        public UserResponseBuilder status(String status) { this.status = status; return this; }
        public UserResponseBuilder lastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; return this; }
        public UserResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public UserResponseBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public UserResponse build() {
            return new UserResponse(id, name, email, role, department, status, lastLogin, createdAt, updatedAt);
        }
    }
}
