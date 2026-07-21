package com.sentinelcore.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "threat_actors")
public class ThreatActor {
    @Id
    private String id;
    
    private String name; // e.g. "APT29", "Lazarus Group"
    private List<String> aliases;
    private String originCountry;
    private List<String> targetedSectors;
    private String description;
    private List<String> associatedMalware;
}
