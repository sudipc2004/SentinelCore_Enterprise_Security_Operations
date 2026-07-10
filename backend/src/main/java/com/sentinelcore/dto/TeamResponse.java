package com.sentinelcore.dto;

import java.time.LocalDateTime;
import java.util.List;

public class TeamResponse {
    private String id;
    private String teamName;
    private String department;
    private UserResponse teamLead;
    private List<UserResponse> members;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public TeamResponse() {}

    public TeamResponse(String id, String teamName, String department, UserResponse teamLead, List<UserResponse> members, String description, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.teamName = teamName;
        this.department = department;
        this.teamLead = teamLead;
        this.members = members;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public UserResponse getTeamLead() { return teamLead; }
    public void setTeamLead(UserResponse teamLead) { this.teamLead = teamLead; }
    public List<UserResponse> getMembers() { return members; }
    public void setMembers(List<UserResponse> members) { this.members = members; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Builder
    public static TeamResponseBuilder builder() {
        return new TeamResponseBuilder();
    }

    public static class TeamResponseBuilder {
        private String id;
        private String teamName;
        private String department;
        private UserResponse teamLead;
        private List<UserResponse> members;
        private String description;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public TeamResponseBuilder id(String id) { this.id = id; return this; }
        public TeamResponseBuilder teamName(String teamName) { this.teamName = teamName; return this; }
        public TeamResponseBuilder department(String department) { this.department = department; return this; }
        public TeamResponseBuilder teamLead(UserResponse teamLead) { this.teamLead = teamLead; return this; }
        public TeamResponseBuilder members(List<UserResponse> members) { this.members = members; return this; }
        public TeamResponseBuilder description(String description) { this.description = description; return this; }
        public TeamResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public TeamResponseBuilder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public TeamResponse build() {
            return new TeamResponse(id, teamName, department, teamLead, members, description, createdAt, updatedAt);
        }
    }
}
