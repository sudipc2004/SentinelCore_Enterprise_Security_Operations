package com.sentinelcore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamResponse {
    private String id;
    private String teamName;
    private String department;
    private UserResponse teamLead;
    private List<UserResponse> members;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
