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
@Document(collection = "patches")
public class Patch {
    @Id
    private String id;
    
    private String cveId; // e.g. "CVE-2023-38606"
    private String patchId; // KB number or identifier
    private String vendor; // e.g. "Microsoft", "Ubuntu"
    private String affectedProduct;
    private String fixedVersion;
    private LocalDateTime releaseDate;
    private String downloadUrl;
    private String status; // "PENDING", "DEPLOYED", "FAILED"
}
