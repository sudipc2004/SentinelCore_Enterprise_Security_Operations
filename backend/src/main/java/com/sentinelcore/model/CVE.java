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
@Document(collection = "cves")
public class CVE {
    @Id
    private String id;
    
    private String cveId; // e.g. "CVE-2023-38606"
    private String description;
    private double cvssScore; // 0.0 - 10.0
    private String severity; // "LOW", "MEDIUM", "HIGH", "CRITICAL"
    private double epssScore; // Exploit Prediction Scoring System, 0.0 - 1.0
    private String cwe; // Common Weakness Enumeration, e.g. "CWE-89"
    private List<String> capec; // Common Attack Pattern Enumeration and Classification, e.g. ["CAPEC-66"]
    private LocalDateTime publishedDate;
}
