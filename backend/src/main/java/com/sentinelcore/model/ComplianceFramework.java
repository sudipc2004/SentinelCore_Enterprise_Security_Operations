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
@Document(collection = "compliance_frameworks")
public class ComplianceFramework {
    @Id
    private String id;

    private String frameworkId;
    private String label;
    private String description;
    private String badge;
    @Builder.Default
    private List<ComplianceDomain> domains = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComplianceDomain {
        private String id;
        private String name;
        private String icon;
        private int controls;
        private int compliant;
        private int inReview;
        private int open;
        @Builder.Default
        private List<ComplianceEvidence> evidence = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComplianceEvidence {
        private String id;
        private String fileName;
        private String note;
        private String uploadedBy;
        private LocalDateTime uploadedAt;
    }
}
