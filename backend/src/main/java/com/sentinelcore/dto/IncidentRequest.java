package com.sentinelcore.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class IncidentRequest {
    @NotBlank(message = "Incident title is required")
    private String title;

    private String description;

    @NotBlank(message = "Priority is required")
    private String priority;

    @NotBlank(message = "Status is required")
    private String status;

    private String category;

    private String source;

    private String assignedTo;

    private String assignedTeam;

    private LocalDateTime dueAt;
}
