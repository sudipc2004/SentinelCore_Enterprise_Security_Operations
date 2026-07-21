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
@Document(collection = "ioc_enrichments")
public class IOCEnrichment {
    @Id
    private String id;
    
    private String iocId;
    private String country;
    private String countryCode;
    private String isp;
    private String asn;
    private double latitude;
    private double longitude;
    private double reputationScore; // 0 - 100
    private double confidenceScore; // 0 - 100
    private String malwareFamily;
    private String threatCategory;
    private List<String> associatedCves;
    private List<String> relatedThreatActors;
    private List<String> mitreAttacks; // e.g. ["T1110", "T1078"]
    private LocalDateTime firstSeen;
    private LocalDateTime lastSeen;
}
