package com.sentinelcore.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "playbooks")
public class Playbook {

    @Id
    private String id;

    private String name;
    private String description;
    private String triggerType; // MANUAL, ALERT_RULE
    private String linkedAlertRuleId;
    private String status; // ACTIVE, INACTIVE

    @Builder.Default
    private List<PlaybookStep> steps = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastRunAt;
    private String lastRunStatus; // SUCCESS, FAILED

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlaybookStep {
        private String id;
        private String type; // NOTIFY, CONTAIN, INVESTIGATE, ESCALATE, REMEDIATE, BLOCK, TICKET
        private String title;
        private String description;
        private String actionNotes;
    }
}
