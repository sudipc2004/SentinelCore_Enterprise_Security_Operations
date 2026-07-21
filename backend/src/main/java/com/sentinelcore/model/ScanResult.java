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
@Document(collection = "scan_results")
public class ScanResult {
    @Id
    private String id;
    
    private String scanName;
    private String scannerType; // "NESSUS", "OPENVAS", "INTERNAL"
    private LocalDateTime scanDate;
    private String targetRange;
    private int vulnerabilitiesFoundCount;
    private String status; // "COMPLETED", "FAILED"
    private String rawImportData;
}
