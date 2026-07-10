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
@Document(collection = "audit_logs")
public class AuditLog {
    @Id
    private String id;

    private String userId;

    private String userEmail;

    private String action; // LOGIN_SUCCESS, USER_CREATED, etc.

    private String module; // AUTH, USER, TEAM

    private String description;

    private LocalDateTime timestamp;

    private String ipAddress;
}
