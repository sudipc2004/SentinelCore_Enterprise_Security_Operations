package com.sentinelcore.dto;

import com.sentinelcore.model.Incident;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class IncidentResponse {
    private String id;
    private String title;
    private String description;
    private String priority;
    private String status;
    private String category;
    private String source;
    private UserResponse assignedTo;
    private TeamResponse assignedTeam;
    private LocalDateTime dueAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static IncidentResponse fromIncident(Incident incident, UserResponse assignee) {
        return fromIncident(incident, assignee, null);
    }

    public static IncidentResponse fromIncident(Incident incident, UserResponse assignee, TeamResponse assignedTeam) {
        return IncidentResponse.builder()
                .id(incident.getId())
                .title(incident.getTitle())
                .description(incident.getDescription())
                .priority(incident.getPriority())
                .status(incident.getStatus())
                .category(incident.getCategory())
                .source(incident.getSource())
                .assignedTo(assignee)
                .assignedTeam(assignedTeam)
                .dueAt(incident.getDueAt())
                .resolvedAt(incident.getResolvedAt())
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt())
                .build();
    }
}
