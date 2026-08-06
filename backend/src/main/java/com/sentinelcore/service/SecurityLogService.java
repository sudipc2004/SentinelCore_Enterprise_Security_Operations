package com.sentinelcore.service;

import com.sentinelcore.exception.BadRequestException;
import com.sentinelcore.exception.ResourceNotFoundException;
import com.sentinelcore.model.Asset;
import com.sentinelcore.model.SecurityLog;
import com.sentinelcore.model.ThreatIntel;
import com.sentinelcore.repository.AssetRepository;
import com.sentinelcore.repository.SecurityLogRepository;
import com.sentinelcore.repository.ThreatIntelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SecurityLogService {

    private static final Pattern IP_PATTERN = Pattern.compile("\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern PORT_PATTERN = Pattern.compile("(?i)\\bport[=: ]+(\\d{1,5})\\b");
    private static final Pattern BYTES_PATTERN = Pattern.compile("(?i)\\bbytes[=: ]+(\\d+)\\b");
    private static final List<Pattern> SQL_INJECTION_PATTERNS = List.of(
            Pattern.compile("(?i)(?:'|%27)\\s*(?:or|and)\\s*(?:'|%27)?\\d+(?:'|%27)?\\s*=\\s*(?:'|%27)?\\d+"),
            Pattern.compile("(?i)\\bunion\\s+(?:all\\s+)?select\\b"),
            Pattern.compile("(?i)\\bselect\\b.+\\bfrom\\b.+\\bwhere\\b"),
            Pattern.compile("(?i)\\b(?:drop|alter|truncate)\\s+table\\b"),
            Pattern.compile("(?i)(?:--|#|/\\*|%2d%2d|%23|%2f\\*)"),
            Pattern.compile("(?i)\\b(?:sleep|benchmark|xp_cmdshell|information_schema)\\s*\\(")
    );
    private static final List<Pattern> RANSOMWARE_PATTERNS = List.of(
            Pattern.compile("(?i)\\bransomware\\b|\\bransom\\s+note\\b|\\bdecrypt(?:ion)?\\s+key\\b"),
            Pattern.compile("(?i)\\b(?:vssadmin\\s+delete\\s+shadows|wmic\\s+shadowcopy\\s+delete|bcdedit\\s+/set)\\b"),
            Pattern.compile("(?i)\\b(?:cipher\\s+/w|wevtutil\\s+cl|wbadmin\\s+delete\\s+catalog)\\b"),
            Pattern.compile("(?i)\\.(?:locked|lockbit|conti|akira|blackcat|enc|encrypted)\\b"),
            Pattern.compile("(?i)\\bmass\\s+(?:file\\s+)?(?:rename|encrypt|modification)\\b")
    );
    private static final List<Pattern> FAILED_LOGIN_PATTERNS = List.of(
            Pattern.compile("(?i)\\bfailed\\s+(?:login|logon|authentication|password)\\b"),
            Pattern.compile("(?i)\\blogin\\s+failed\\b|\\blogon\\s+failure\\b|\\bauthentication\\s+failure\\b"),
            Pattern.compile("(?i)\\binvalid\\s+(?:password|credentials)\\b"),
            Pattern.compile("(?i)\\bwindows\\s+event\\s+4625\\b|\\bevent\\s?id[=: ]4625\\b|\\bsshd\\b.+\\bfailed\\s+password\\b")
    );
    private static final List<Pattern> SUSPICIOUS_GEO_PATTERNS = List.of(
            Pattern.compile("(?i)\\b(?:impossible\\s+travel|suspicious\\s+(?:geo|location|login)|unusual\\s+geographic|geo[-_]?velocity|multi[-_]?location)\\b"),
            Pattern.compile("(?i)\\blogin\\s+from\\s+(?:mumbai|bangalore|bengaluru|delhi|singapore|tokyo|london|new york)\\b")
    );

    @Autowired
    private SecurityLogRepository securityLogRepository;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private ThreatIntelRepository threatIntelRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private LiveEventService liveEventService;

    @Autowired
    private AlertService alertService;

    public Page<SecurityLog> getLogs(String search, String systemType, Boolean isAnomaly, String startDate, String endDate, Pageable pageable) {
        Query query = new Query();
        List<Criteria> criteria = new ArrayList<>();

        if (StringUtils.hasText(systemType)) {
            criteria.add(Criteria.where("systemType").is(systemType));
        }
        if (isAnomaly != null) {
            criteria.add(Criteria.where("anomaly").is(isAnomaly));
        }
        if (StringUtils.hasText(search)) {
            Pattern pattern = Pattern.compile(Pattern.quote(search), Pattern.CASE_INSENSITIVE);
            criteria.add(new Criteria().orOperator(
                    Criteria.where("rawMessage").regex(pattern),
                    Criteria.where("ipAddress").regex(pattern),
                    Criteria.where("userEmail").regex(pattern),
                    Criteria.where("device").regex(pattern)
            ));
        }
        addDateCriteria(criteria, startDate, endDate);

        if (!criteria.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteria.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(query, SecurityLog.class);
        query.with(pageable);
        List<SecurityLog> logs = mongoTemplate.find(query, SecurityLog.class);
        return new PageImpl<>(logs, pageable, total);
    }

    public int uploadLogs(MultipartFile file, String systemType, String currentUserEmail) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Log file is required.");
        }
        if (!StringUtils.hasText(systemType)) {
            throw new BadRequestException("System type is required.");
        }

        List<SecurityLog> logs = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (StringUtils.hasText(line)) {
                    logs.add(buildLog(line, systemType));
                }
            }
        } catch (Exception ex) {
            throw new BadRequestException("Could not ingest log file: " + ex.getMessage());
        }

        securityLogRepository.saveAll(logs);
        
        // Trigger Alert Engine (aggregates and deduplicates security rules & anomalies)
        alertService.processLogs(logs);
        
        auditLogService.log(null, currentUserEmail, "LOGS_UPLOADED", "LOG_MANAGEMENT",
                "Uploaded " + logs.size() + " " + systemType + " log records");
        return logs.size();
    }

    public void deleteLog(String id, String currentUserEmail) {
        SecurityLog log = securityLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Log not found with id: " + id));
        securityLogRepository.delete(log);
        auditLogService.log(null, currentUserEmail, "LOG_DELETED", "LOG_MANAGEMENT",
                "Deleted log record: " + id);
    }

    private SecurityLog buildLog(String rawMessage, String systemType) {
        String ipAddress = firstMatch(IP_PATTERN, rawMessage, 0);
        String userEmail = firstMatch(EMAIL_PATTERN, rawMessage, 0);
        Integer port = parseInteger(firstMatch(PORT_PATTERN, rawMessage, 1));
        Long bytes = parseLong(firstMatch(BYTES_PATTERN, rawMessage, 1));

        boolean isExplicitIocFormat = rawMessage.startsWith("DOMAIN,") || rawMessage.startsWith("URL,") || rawMessage.startsWith("IP,") || rawMessage.startsWith("MALWARE_HASH,");
        
        if (isExplicitIocFormat) {
            String[] parts = rawMessage.split(",");
            String iocType = parts.length > 0 ? parts[0].trim().toUpperCase() : "DOMAIN";
            String iocValue = parts.length > 1 ? parts[1].trim() : "";
            String iocDesc = parts.length > 2 ? parts[2].trim() : "Malicious Indicator";
            String iocSource = parts.length > 3 ? parts[3].trim() : "Log Ingestion Engine";

            if (StringUtils.hasText(iocValue) && !threatIntelRepository.existsByTypeAndValue(iocType, iocValue)) {
                ThreatIntel intel = ThreatIntel.builder()
                        .type(iocType)
                        .value(iocValue)
                        .description(iocDesc)
                        .source(iocSource)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                threatIntelRepository.save(intel);
                auditLogService.log("system", "system@sentinelcore.local", "THREAT_INTEL_AUTO_BLOCKED", "THREAT_INTEL",
                        "Auto-blocked " + iocType + " [" + iocValue + "] under Threat Intel from log ingestion");
            }
        }

        Optional<Asset> asset = StringUtils.hasText(ipAddress)
                ? assetRepository.findByIpAddress(ipAddress)
                : Optional.empty();

        List<ThreatIntel> iocs = threatIntelRepository.findAll();
        boolean iocHit = iocs.stream()
                .anyMatch(ioc -> StringUtils.hasText(ioc.getValue()) && rawMessage.toLowerCase().contains(ioc.getValue().toLowerCase()));
        
        boolean sqlInjection = matchesAny(rawMessage, SQL_INJECTION_PATTERNS);
        boolean ransomware = matchesAny(rawMessage, RANSOMWARE_PATTERNS);
        boolean bruteForceSignal = matchesAny(rawMessage, FAILED_LOGIN_PATTERNS);
        boolean suspiciousGeo = matchesAny(rawMessage, SUSPICIOUS_GEO_PATTERNS);
        
        List<String> privEscalationKeywords = List.of("sudo failed", "root access denied");
        boolean privEscalation = containsAny(rawMessage.toLowerCase(), privEscalationKeywords);
        
        boolean largeDataTransfer = bytes != null && bytes > 1_000_000_000L;
        
        List<String> threatKeywords = List.of(
                "phishing", "malicious", "ransomware", "stealer", "c2", "darkweb", "exfil",
                "proxy", "dropper", "webshell", "backdoor", "beacon", "harvester", "attack",
                "exploit", "trojan", "keylogger", "botnet", "failed", "denied", "blocked", "unauthorized", "impossible travel"
        );
        boolean threatKeywordHit = containsAny(rawMessage.toLowerCase(), threatKeywords);
        
        boolean anomaly = isExplicitIocFormat || threatKeywordHit || iocHit || sqlInjection || ransomware || bruteForceSignal || suspiciousGeo || privEscalation || largeDataTransfer;
        
        double riskScore = (isExplicitIocFormat || ransomware) ? 0.96 :
                           (iocHit || threatKeywordHit) ? 0.95 :
                           suspiciousGeo ? 0.94 :
                           sqlInjection ? 0.92 :
                           privEscalation ? 0.90 :
                           largeDataTransfer ? 0.85 :
                           bruteForceSignal ? 0.78 : asset.map(this::assetRiskScore).orElse(0.18);
        
        double confidenceScore = anomaly ? 0.95 : 0.61;

        return SecurityLog.builder()
                .timestamp(extractTimestamp(rawMessage))
                .systemType(systemType)
                .ipAddress(StringUtils.hasText(ipAddress) ? ipAddress : "0.0.0.0")
                .port(port == null ? 0 : port)
                .protocol(systemType.equalsIgnoreCase("WINDOWS") ? "EVENT" : "TCP")
                .userEmail(StringUtils.hasText(userEmail) ? userEmail : "unknown")
                .device(asset.map(Asset::getName).orElse(systemType + "-source"))
                .country("Unknown")
                .bytes(bytes == null ? 0L : bytes)
                .anomaly(anomaly)
                .confidenceScore(confidenceScore)
                .riskScore(riskScore)
                .rawMessage(rawMessage)
                .relatedAssetId(asset.map(Asset::getId).orElse(null))
                .ownerTeamId(asset.map(Asset::getOwnerTeamId).orElse(null))
                .createdAt(LocalDateTime.now())
                .build();
    }

    private void addDateCriteria(List<Criteria> criteria, String startDate, String endDate) {
        LocalDateTime start = parseDate(startDate);
        LocalDateTime end = parseDate(endDate);
        if (start != null && end != null) {
            criteria.add(Criteria.where("timestamp").gte(start).lte(end));
        } else if (start != null) {
            criteria.add(Criteria.where("timestamp").gte(start));
        } else if (end != null) {
            criteria.add(Criteria.where("timestamp").lte(end));
        }
    }

    private LocalDateTime extractTimestamp(String rawMessage) {
        String[] parts = rawMessage.split("\\s+", 2);
        if (parts.length > 0) {
            LocalDateTime parsed = parseDate(parts[0]);
            if (parsed != null) {
                return parsed;
            }
        }
        return LocalDateTime.now();
    }

    private LocalDateTime parseDate(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            String normalized = value.endsWith("Z") ? value.substring(0, value.length() - 1) : value;
            return LocalDateTime.parse(normalized);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private String firstMatch(Pattern pattern, String value, int group) {
        Matcher matcher = pattern.matcher(value);
        return matcher.find() ? matcher.group(group) : null;
    }

    private Integer parseInteger(String value) {
        try {
            return StringUtils.hasText(value) ? Integer.parseInt(value) : null;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Long parseLong(String value) {
        try {
            return StringUtils.hasText(value) ? Long.parseLong(value) : null;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private boolean containsAny(String value, List<String> keywords) {
        return keywords.stream().anyMatch(value::contains);
    }

    private boolean matchesAny(String value, List<Pattern> patterns) {
        return patterns.stream().anyMatch(pattern -> pattern.matcher(value).find());
    }

    private double assetRiskScore(Asset asset) {
        if ("CRITICAL".equalsIgnoreCase(asset.getCriticality())) {
            return 0.42;
        }
        if ("HIGH".equalsIgnoreCase(asset.getCriticality())) {
            return 0.36;
        }
        return 0.22;
    }
}
