package com.sentinelcore.dto;

import java.util.List;

public class TeamDto {
    private String teamName;
    private String department;
    private String description;
    private String teamLead; // User ID
    private List<String> members; // List of User IDs

    // Getters and Setters
    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTeamLead() { return teamLead; }
    public void setTeamLead(String teamLead) { this.teamLead = teamLead; }
    public List<String> getMembers() { return members; }
    public void setMembers(List<String> members) { this.members = members; }
}
