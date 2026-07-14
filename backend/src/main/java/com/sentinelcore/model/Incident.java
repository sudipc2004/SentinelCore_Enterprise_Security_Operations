package com.sentinelcore.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "incidents")
public class Incident {
    @Id
    private String id;

    private String title;

    private String description;

    private String priority;

    private String status;

    private String category;

    private String source;

    private String assignedTo;

    private String assignedTeam;

    private LocalDateTime dueAt;

    private LocalDateTime resolvedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
