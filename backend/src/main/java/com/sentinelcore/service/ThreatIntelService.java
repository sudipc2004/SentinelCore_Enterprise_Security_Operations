package com.sentinelcore.service;

import com.sentinelcore.exception.BadRequestException;
import com.sentinelcore.exception.ResourceNotFoundException;
import com.sentinelcore.model.*;
import com.sentinelcore.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ThreatIntelService {

    @Autowired
    private ThreatIOCRepository threatIOCRepository;

    @Autowired
    private ThreatFeedRepository threatFeedRepository;

    @Autowired
    private IOCEnrichmentRepository iocEnrichmentRepository;

    @Autowired
    private ThreatActorRepository threatActorRepository;

    @Autowired
    private MalwareRepository malwareRepository;

    @Autowired
    private CVERepository cveRepository;

    @Autowired
    private AnalystNoteRepository analystNoteRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private AuditLogService auditLogService;

    // --- IOC CRUD ---

    public Page<ThreatIOC> searchIocs(String search, String type, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (StringUtils.hasText(search) && StringUtils.hasText(type)) {
            return threatIOCRepository.findByValueContainingIgnoreCaseOrDescriptionContainingIgnoreCase(search, search, pageable);
        } else if (StringUtils.hasText(type)) {
            return threatIOCRepository.findByType(type.toUpperCase(), pageable);
        } else if (StringUtils.hasText(search)) {
            return threatIOCRepository.findByValueContainingIgnoreCaseOrDescriptionContainingIgnoreCase(search, search, pageable);
        }
        return threatIOCRepository.findAll(pageable);
    }

    public List<ThreatIOC> getAllIocs() {
        return threatIOCRepository.findAll();
    }

    public ThreatIOC getIocById(String id) {
        return threatIOCRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("IOC not found with id: " + id));
    }

    public ThreatIOC createIoc(ThreatIOC request, String currentUserEmail) {
        validateIoc(request);
        String value = request.getValue().trim();
        String type = request.getType().trim().toUpperCase();

        if (threatIOCRepository.existsByTypeAndValue(type, value)) {
            throw new BadRequestException("IOC already exists.");
        }

        LocalDateTime now = LocalDateTime.now();
        double riskScore = calculateInitialRiskScore(type, value);
        
        ThreatIOC ioc = ThreatIOC.builder()
                .type(type)
                .value(value)
                .description(request.getDescription())
                .status("ACTIVE")
                .tags(request.getTags() != null ? request.getTags() : new ArrayList<>())
                .riskScore(riskScore)
                .source(StringUtils.hasText(request.getSource()) ? request.getSource() : "Manual")
                .reviewerTeamId(request.getReviewerTeamId())
                .createdAt(now)
                .updatedAt(now)
                .build();

        ThreatIOC saved = threatIOCRepository.save(ioc);
        auditLogService.log(null, currentUserEmail, "IOC_CREATED", "THREAT_INTEL",
                "Created Threat IOC: " + saved.getValue());
        
        // Auto trigger enrichment mock
        enrichIoc(saved.getId(), currentUserEmail);

        return saved;
    }

    public ThreatIOC updateIoc(String id, ThreatIOC request, String currentUserEmail) {
        ThreatIOC ioc = getIocById(id);
        ioc.setDescription(request.getDescription());
        ioc.setStatus(request.getStatus());
        ioc.setTags(request.getTags());
        if (request.getRiskScore() > 0) {
            ioc.setRiskScore(request.getRiskScore());
        }
        ioc.setReviewerTeamId(request.getReviewerTeamId());
        ioc.setUpdatedAt(LocalDateTime.now());

        ThreatIOC saved = threatIOCRepository.save(ioc);
        auditLogService.log(null, currentUserEmail, "IOC_UPDATED", "THREAT_INTEL",
                "Updated Threat IOC: " + saved.getValue());
        return saved;
    }

    public void deleteIoc(String id, String currentUserEmail) {
        ThreatIOC ioc = getIocById(id);
        threatIOCRepository.delete(ioc);
        
        // delete enrichment
        iocEnrichmentRepository.findByIocId(id).ifPresent(e -> iocEnrichmentRepository.delete(e));
        
        auditLogService.log(null, currentUserEmail, "IOC_DELETED", "THREAT_INTEL",
                "Deleted Threat IOC: " + ioc.getValue());
    }

    // --- Enrichment ---

    public IOCEnrichment getEnrichment(String iocId) {
        return iocEnrichmentRepository.findByIocId(iocId)
                .orElseGet(() -> IOCEnrichment.builder().iocId(iocId).mitreAttacks(new ArrayList<>()).build());
    }

    public IOCEnrichment enrichIoc(String iocId, String currentUserEmail) {
        ThreatIOC ioc = getIocById(iocId);
        
        // Generate mock enrichment details
        String type = ioc.getType().toUpperCase();
        String value = ioc.getValue();
        
        String country = "United States";
        String countryCode = "US";
        String isp = "Amazon Technologies";
        String asn = "AS16509";
        double latitude = 37.7749;
        double longitude = -122.4194;
        String malwareFamily = "Unknown";
        String category = "Exploit Attempt";
        
        if (type.equals("IP")) {
            if (value.startsWith("185.")) {
                country = "Russia";
                countryCode = "RU";
                isp = "Mtel Network";
                asn = "AS4231";
                latitude = 55.7558;
                longitude = 37.6173;
                malwareFamily = "CobaltStrike";
                category = "Command & Control";
            } else if (value.startsWith("103.")) {
                country = "China";
                countryCode = "CN";
                isp = "Chinanet";
                asn = "AS4134";
                latitude = 39.9042;
                longitude = 116.4074;
                malwareFamily = "Mirai Botnet";
                category = "DDoS Node";
            }
        } else if (type.equals("DOMAIN") || type.equals("URL")) {
            if (value.contains(".ru") || value.contains("phish")) {
                country = "Seychelles";
                countryCode = "SC";
                isp = "Cloud Registrar";
                asn = "AS28456";
                malwareFamily = "Redline Stealer";
                category = "Credential Phishing";
            }
        }
        
        IOCEnrichment enrichment = iocEnrichmentRepository.findByIocId(iocId)
                .orElse(IOCEnrichment.builder().iocId(iocId).build());
        
        enrichment.setCountry(country);
        enrichment.setCountryCode(countryCode);
        enrichment.setIsp(isp);
        enrichment.setAsn(asn);
        enrichment.setLatitude(latitude);
        enrichment.setLongitude(longitude);
        enrichment.setReputationScore(ioc.getRiskScore());
        enrichment.setConfidenceScore(85.0);
        enrichment.setMalwareFamily(malwareFamily);
        enrichment.setThreatCategory(category);
        enrichment.setAssociatedCves(Arrays.asList("CVE-2023-38606", "CVE-2023-32409"));
        enrichment.setRelatedThreatActors(Arrays.asList("APT29", "Lazarus Group"));
        enrichment.setMitreAttacks(Arrays.asList("T1110", "T1078", "T1566"));
        enrichment.setFirstSeen(LocalDateTime.now().minusDays(10));
        enrichment.setLastSeen(LocalDateTime.now());
        
        IOCEnrichment saved = iocEnrichmentRepository.save(enrichment);
        
        // Sync actor profiles
        createMockActorAndMalware();
        
        auditLogService.log(null, currentUserEmail, "IOC_ENRICHED", "THREAT_INTEL",
                "Enriched Threat IOC: " + ioc.getValue());
        
        return saved;
    }

    // --- Threat Feeds Sync ---

    public List<ThreatFeed> getFeeds() {
        List<ThreatFeed> feeds = threatFeedRepository.findAll();
        if (feeds.isEmpty()) {
            feeds = initDefaultFeeds();
        }
        return feeds;
    }

    public ThreatFeed toggleFeed(String id, String currentUserEmail) {
        ThreatFeed feed = threatFeedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feed not found."));
        feed.setEnabled(!feed.isEnabled());
        ThreatFeed saved = threatFeedRepository.save(feed);
        auditLogService.log(null, currentUserEmail, "FEED_TOGGLED", "THREAT_INTEL",
                "Toggled feed " + feed.getName() + " to " + (feed.isEnabled() ? "ENABLED" : "DISABLED"));
        return saved;
    }

    public ThreatFeed syncFeed(String id, String currentUserEmail) {
        ThreatFeed feed = threatFeedRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feed not found."));
        
        feed.setStatus("ACTIVE");
        feed.setLastSync(LocalDateTime.now());
        ThreatFeed saved = threatFeedRepository.save(feed);
        
        // Seed mock IOCs matching the feed type
        seedMockFeedIOCs(feed.getName());
        
        auditLogService.log(null, currentUserEmail, "FEED_SYNC", "THREAT_INTEL",
                "Synchronized Threat intelligence feed: " + feed.getName());
        return saved;
    }

    // --- Analyst Notes ---

    public List<AnalystNote> getNotes(String targetId, String targetType) {
        return analystNoteRepository.findByTargetIdAndTargetType(targetId, targetType);
    }

    public AnalystNote addNote(String targetId, String targetType, String content, String email, String name) {
        AnalystNote note = AnalystNote.builder()
                .targetId(targetId)
                .targetType(targetType)
                .authorEmail(email)
                .authorName(name)
                .content(content)
                .createdAt(LocalDateTime.now())
                .build();
        return analystNoteRepository.save(note);
    }

    // --- Import / Export Helpers ---

    public List<ThreatIOC> importIocs(List<ThreatIOC> iocs, String currentUserEmail) {
        List<ThreatIOC> imported = new ArrayList<>();
        for (ThreatIOC request : iocs) {
            try {
                imported.add(createIoc(request, currentUserEmail));
            } catch (Exception e) {
                // skip duplicate/invalid
            }
        }
        return imported;
    }

    // --- Private Helper Methods ---

    private double calculateInitialRiskScore(String type, String value) {
        double score = 45.0; // default medium
        if (type.equals("IP")) {
            if (value.startsWith("185.") || value.startsWith("103.")) score = 88.0;
        } else if (type.equals("DOMAIN")) {
            if (value.contains(".ru") || value.contains("phish")) score = 92.0;
        } else if (type.equals("CVE")) {
            score = 75.0;
        }
        return score;
    }

    private void validateIoc(ThreatIOC request) {
        if (!StringUtils.hasText(request.getType())) {
            throw new BadRequestException("IOC type is required.");
        }
        if (!StringUtils.hasText(request.getValue())) {
            throw new BadRequestException("IOC value is required.");
        }
        if (StringUtils.hasText(request.getReviewerTeamId()) && !teamRepository.existsById(request.getReviewerTeamId())) {
            throw new ResourceNotFoundException("Reviewer team not found.");
        }
    }

    private List<ThreatFeed> initDefaultFeeds() {
        List<ThreatFeed> feeds = Arrays.asList(
            ThreatFeed.builder().name("VirusTotal").url("https://www.virustotal.com/api").enabled(true).status("ACTIVE").syncIntervalMinutes(60).build(),
            ThreatFeed.builder().name("AlienVault OTX").url("https://otx.alienvault.com/api").enabled(true).status("ACTIVE").syncIntervalMinutes(120).build(),
            ThreatFeed.builder().name("AbuseIPDB").url("https://api.abuseipdb.com/api").enabled(false).status("INACTIVE").syncIntervalMinutes(30).build(),
            ThreatFeed.builder().name("PhishTank").url("https://www.phishtank.com/api").enabled(true).status("ACTIVE").syncIntervalMinutes(180).build()
        );
        return threatFeedRepository.saveAll(feeds);
    }

    private void createMockActorAndMalware() {
        if (threatActorRepository.count() == 0) {
            threatActorRepository.save(ThreatActor.builder()
                .name("APT29")
                .aliases(Arrays.asList("Cozy Bear", "Nobelium"))
                .originCountry("Russia")
                .targetedSectors(Arrays.asList("Government", "Defense", "NATO"))
                .description("State-sponsored cyber espionage group active since at least 2008.")
                .associatedMalware(Arrays.asList("CobaltStrike", "Redline Stealer"))
                .build());
            
            threatActorRepository.save(ThreatActor.builder()
                .name("Lazarus Group")
                .aliases(Arrays.asList("Guardians of Peace", "Hidden Cobra"))
                .originCountry("North Korea")
                .targetedSectors(Arrays.asList("Finance", "Cryptocurrency", "Energy"))
                .description("State-sponsored military hacking group responsible for major cryptocurrency thefts.")
                .associatedMalware(Arrays.asList("Destover", "Mimikatz"))
                .build());
        }

        if (malwareRepository.count() == 0) {
            malwareRepository.save(Malware.builder()
                .name("CobaltStrike")
                .type("TROJAN")
                .description("Legitimate penetration testing tool frequently repurposed by threat actors for backdoor C2.")
                .signatures(Arrays.asList("md5:9d5e30", "sha256:d17ab8"))
                .associatedActors(Arrays.asList("APT29"))
                .build());
            
            malwareRepository.save(Malware.builder()
                .name("Redline Stealer")
                .type("SPYWARE")
                .description("Credential harvester that collects browser cookies, stored passwords, and crypto wallets.")
                .signatures(Arrays.asList("md5:5e3bc8"))
                .associatedActors(Arrays.asList("APT29", "Lazarus Group"))
                .build());
        }
    }

    private void seedMockFeedIOCs(String feedName) {
        if (feedName.equalsIgnoreCase("VirusTotal")) {
            createMockIocIfAbsent("IP", "95.142.10.4", "Known malware communication endpoint reported by VT.", "VirusTotal");
        } else if (feedName.equalsIgnoreCase("PhishTank")) {
            createMockIocIfAbsent("DOMAIN", "verify-paypal-secure-portal.net", "Credential harvest spoof PayPal login page.", "PhishTank");
        } else if (feedName.equalsIgnoreCase("AlienVault OTX")) {
            createMockIocIfAbsent("SHA256", "7e8a946b281c9533f81e3a479ff73010c2eb7d8c039ab640989f6cf3c150c2df", "Redline payload installer binary hash.", "AlienVault OTX");
        }
    }

    private void createMockIocIfAbsent(String type, String value, String desc, String source) {
        if (!threatIOCRepository.existsByTypeAndValue(type, value)) {
            ThreatIOC ioc = ThreatIOC.builder()
                    .type(type)
                    .value(value)
                    .description(desc)
                    .status("ACTIVE")
                    .tags(Arrays.asList("FeedImport", source.replace(" ", "")))
                    .riskScore(type.equals("IP") ? 82.0 : 95.0)
                    .source(source)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            threatIOCRepository.save(ioc);
        }
    }
}
