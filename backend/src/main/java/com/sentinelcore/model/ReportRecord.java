package com.sentinelcore.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "reports")
public class ReportRecord {
    @Id
    private String id;

    private String type;
    private String title;
    private String generatedBy;
    private String format;
    private String size;
    private String dateFrom;
    private String dateTo;
    private String severityFilter;
    private String teamFilter;
    private String assetFilter;
    private Boolean scheduled;
    private String frequency;
    @Builder.Default
    private Map<String, Object> metrics = new HashMap<>();
    private LocalDateTime createdAt;
}
