package com.sentinelcore.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "teams")
public class Team {
    @Id
    private String id;

    private String teamName;

    private String department;

    private String teamLead; // User ID of team lead

    private List<String> members; // List of User IDs

    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
