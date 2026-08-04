package com.sentinelcore.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class TeamRequest {
    @NotBlank(message = "Team name is required")
    private String teamName;

    private String department;

    private String teamLead; // User ID

    private List<String> members; // List of User IDs

    private String description;
}
