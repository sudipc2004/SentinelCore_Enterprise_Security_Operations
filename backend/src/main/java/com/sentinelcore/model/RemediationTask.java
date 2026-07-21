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
@Document(collection = "remediation_tasks")
public class RemediationTask {
    @Id
    private String id;
    
    private String vulnerabilityId;
    private String assignedAnalystEmail;
    private LocalDateTime dueDate;
    private String status; // "NEW", "IN_PROGRESS", "RESOLVED", "CLOSED", "UNDER_REVIEW"
    private boolean exceptionApproved;
    private String exceptionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
