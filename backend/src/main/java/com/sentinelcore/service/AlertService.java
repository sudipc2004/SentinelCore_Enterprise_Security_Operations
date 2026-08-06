package com.sentinelcore.service;

import com.sentinelcore.exception.ResourceNotFoundException;
import com.sentinelcore.exception.BadRequestException;
import com.sentinelcore.model.Alert;
import com.sentinelcore.model.SecurityLog;
import com.sentinelcore.repository.AlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AlertService {

    private static final int SUSPICIOUS_LOGIN_THRESHOLD = 5;
    private static final int SUSPICIOUS_LOGIN_WINDOW_MINUTES = 5;
    private static final int BRUTE_FORCE_THRESHOLD = 20;
    private static final int BRUTE_FORCE_WINDOW_MINUTES = 1;
    private static final List<String> ACTIVE_STATUSES = List.of("NEW", "OPEN", "INVESTIGATING", "ACKNOWLEDGED");
    private static final List<String> VALID_STATUSES = List.of("OPEN", "ACKNOWLEDGED", "DISMISSED", "RESOLVED", "NEW", "INVESTIGATING", "FALSE_POSITIVE");

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
    private AlertRepository alertRepository;

    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Lazy
    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private LiveEventService liveEventService;

    @Lazy
    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.sentinelcore.repository.ThreatIntelRepository threatIntelRepository;

    private static final Pattern URL_PATTERN = Pattern.compile("(?i)https?://[\\w\\.-]+(?:\\:[0-9]+)?(?:/[\\w\\.\\-%\\?=&]*)*");
    private static final Pattern DOMAIN_PATTERN = Pattern.compile("(?i)\\b(?:[a-zA-Z0-9-]+\\.)+(?:com|org|net|xyz|ru|info|io|co|in|biz|gov|uk|cn)\\b");
    private static final Pattern IP_PATTERN = Pattern.compile("\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b");

    private void autoBlockIocsFromLogAndAlert(SecurityLog log, String sourceIp, String alertTitle, String alertDescription) {
        if (threatIntelRepository == null) return;

        String rawLog = log != null && log.getRawMessage() != null ? log.getRawMessage() : "";
        String ipParam = StringUtils.hasText(sourceIp) ? sourceIp : "";
        String title = alertTitle != null ? alertTitle : "";
        String desc = alertDescription != null ? alertDescription : "";
        String combinedText = (rawLog + " " + ipParam + " " + title + " " + desc).trim();

        if (!StringUtils.hasText(combinedText)) return;

        // Extract and auto-block URLs
        java.util.regex.Matcher urlMatcher = URL_PATTERN.matcher(combinedText);
        while (urlMatcher.find()) {
            String url = urlMatcher.group().trim();
            saveThreatIntelIoc("URL", url, "Auto-blocked URL from alert: " + (alertTitle != null ? alertTitle : "Security Event"));
        }

        // Extract and auto-block Domains
        java.util.regex.Matcher domainMatcher = DOMAIN_PATTERN.matcher(combinedText);
        while (domainMatcher.find()) {
            String domain = domainMatcher.group().trim().toLowerCase();
            if (!domain.endsWith(".java") && !domain.endsWith(".json") && !domain.endsWith(".csv") && !domain.endsWith(".png") && !domain.endsWith(".jpg")) {
                saveThreatIntelIoc("DOMAIN", domain, "Auto-blocked Domain from alert: " + (alertTitle != null ? alertTitle : "Security Event"));
            }
        }

        // Extract and auto-block IPs
        if (log != null && StringUtils.hasText(log.getIpAddress())) {
            String ip = log.getIpAddress().trim();
            if (!"0.0.0.0".equals(ip) && !"127.0.0.1".equals(ip) && !"localhost".equalsIgnoreCase(ip)) {
                saveThreatIntelIoc("IP", ip, "Auto-blocked IP from alert: " + (alertTitle != null ? alertTitle : "Security Event"));
            }
        }
        if (StringUtils.hasText(sourceIp)) {
            String ip = sourceIp.trim();
            if (!"0.0.0.0".equals(ip) && !"127.0.0.1".equals(ip) && !"localhost".equalsIgnoreCase(ip)) {
                saveThreatIntelIoc("IP", ip, "Auto-blocked IP from alert: " + (alertTitle != null ? alertTitle : "Security Event"));
            }
        }
        java.util.regex.Matcher ipMatcher = IP_PATTERN.matcher(combinedText);
        while (ipMatcher.find()) {
            String ip = ipMatcher.group().trim();
            if (!"0.0.0.0".equals(ip) && !"127.0.0.1".equals(ip) && !"localhost".equalsIgnoreCase(ip)) {
                saveThreatIntelIoc("IP", ip, "Auto-blocked IP from alert: " + (alertTitle != null ? alertTitle : "Security Event"));
            }
        }
    }

    private void saveThreatIntelIoc(String type, String value, String description) {
        if (!StringUtils.hasText(type) || !StringUtils.hasText(value)) return;
        try {
            if (!threatIntelRepository.existsByTypeAndValue(type, value)) {
                com.sentinelcore.model.ThreatIntel intel = com.sentinelcore.model.ThreatIntel.builder()
                        .type(type)
                        .value(value)
                        .description(description)
                        .source("Automated Defense Engine")
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();
                threatIntelRepository.save(intel);
                auditLogService.log("system", "system@sentinelcore.local", "THREAT_INTEL_AUTO_BLOCKED", "THREAT_INTEL",
                        "Auto-blocked " + type + " [" + value + "] under Threat Intel");
                if (notificationService != null) {
                    notificationService.notifyUpdate();
                }
            }
        } catch (Exception ignored) {
        }
    }

    public void processLogs(List<SecurityLog> logs) {
        Set<String> specificallyAlertedLogIds = new HashSet<>();

        for (SecurityLog log : logs) {
            List<RuleMatch> matches = detectSingleLogRules(log);
            for (RuleMatch match : matches) {
                processSecurityRule(log, match);
                if (log.getId() != null) {
                    specificallyAlertedLogIds.add(log.getId());
                }
            }
        }

        specificallyAlertedLogIds.addAll(processFailedLoginBurstRules(logs));

        for (SecurityLog log : logs) {
            boolean hasSpecificAlert = log.getId() != null && specificallyAlertedLogIds.contains(log.getId());
            if (!hasSpecificAlert && (log.isAnomaly() || (log.getRiskScore() != null && log.getRiskScore() > 0.7))) {
                processAnomalousLog(log);
            }
        }
    }

    private List<RuleMatch> detectSingleLogRules(SecurityLog log) {
        String rawMessage = log.getRawMessage() == null ? "" : log.getRawMessage();
        List<RuleMatch> matches = new ArrayList<>();

        if (matchesAny(rawMessage, SQL_INJECTION_PATTERNS)) {
            matches.add(new RuleMatch(
                    "WEB_SQL_INJECTION",
                    "Web Attack",
                    "SQL Injection Attempt Detected",
                    "Detected SQL injection indicators in " + log.getSystemType() + " log from " + log.getIpAddress() + ": " + rawMessage,
                    "CRITICAL",
                    1
            ));
        }

        if (matchesAny(rawMessage, RANSOMWARE_PATTERNS)) {
            matches.add(new RuleMatch(
                    "ENDPOINT_RANSOMWARE_ACTIVITY",
                    "Malware",
                    "Possible Ransomware Activity Detected",
                    "Detected ransomware behavior or tooling indicators in " + log.getSystemType() + " log from " + log.getIpAddress() + ": " + rawMessage,
                    "CRITICAL",
                    1
            ));
        }

        if (matchesAny(rawMessage, SUSPICIOUS_GEO_PATTERNS)) {
            matches.add(new RuleMatch(
                    "AUTH_SUSPICIOUS_GEO_LOGIN",
                    "Authentication",
                    "Suspicious Multi-Location Login / Impossible Travel Detected",
                    "Detected geographic anomaly / impossible travel login indicator in " + log.getSystemType() + " log from " + log.getIpAddress() + ": " + rawMessage,
                    "CRITICAL",
                    1
            ));
        }

        return matches;
    }

    private Set<String> processFailedLoginBurstRules(List<SecurityLog> logs) {
        List<SecurityLog> failedLoginLogs = logs.stream()
                .filter(this::isFailedLoginLog)
                .sorted(Comparator.comparing(log -> log.getTimestamp() != null ? log.getTimestamp() : LocalDateTime.now()))
                .toList();

        Set<String> alertedLogIds = new HashSet<>();
        processFailedLoginGroups(failedLoginLogs, true, alertedLogIds);
        processFailedLoginGroups(failedLoginLogs, false, alertedLogIds);
        return alertedLogIds;
    }

    private void processFailedLoginGroups(List<SecurityLog> failedLoginLogs, boolean groupByIp, Set<String> alertedLogIds) {
        Map<String, List<SecurityLog>> groupedLogs = failedLoginLogs.stream()
                .collect(Collectors.groupingBy(log -> groupByIp ? log.getIpAddress() : log.getUserEmail()));

        for (Map.Entry<String, List<SecurityLog>> entry : groupedLogs.entrySet()) {
            String principal = entry.getKey();
            if (!StringUtils.hasText(principal) || "0.0.0.0".equals(principal) || "unknown".equalsIgnoreCase(principal)) {
                continue;
            }

            List<SecurityLog> logs = entry.getValue().stream()
                    .sorted(Comparator.comparing(log -> log.getTimestamp() != null ? log.getTimestamp() : LocalDateTime.now()))
                    .toList();

            evaluateFailedLoginWindow(logs, principal, groupByIp, BRUTE_FORCE_THRESHOLD, BRUTE_FORCE_WINDOW_MINUTES, "AUTH_BRUTE_FORCE", "CRITICAL", alertedLogIds);
            evaluateFailedLoginWindow(logs, principal, groupByIp, SUSPICIOUS_LOGIN_THRESHOLD, SUSPICIOUS_LOGIN_WINDOW_MINUTES, "AUTH_SUSPICIOUS_LOGIN", "HIGH", alertedLogIds);
        }
    }

    private void evaluateFailedLoginWindow(
            List<SecurityLog> logs,
            String principal,
            boolean groupByIp,
            int threshold,
            int windowMinutes,
            String ruleId,
            String severity,
            Set<String> alertedLogIds
    ) {
        for (int start = 0; start < logs.size(); start++) {
            SecurityLog first = logs.get(start);
            LocalDateTime windowStart = first.getTimestamp() != null ? first.getTimestamp() : LocalDateTime.now();
            LocalDateTime windowEnd = windowStart.plusMinutes(windowMinutes);

            List<SecurityLog> windowLogs = logs.stream()
                    .filter(log -> {
                        LocalDateTime timestamp = log.getTimestamp() != null ? log.getTimestamp() : LocalDateTime.now();
                        return !timestamp.isBefore(windowStart) && !timestamp.isAfter(windowEnd);
                    })
                    .toList();

            if (windowLogs.size() >= threshold) {
                SecurityLog representative = windowLogs.get(windowLogs.size() - 1);
                String scope = groupByIp ? "source IP " + principal : "user " + principal;
                String title = "AUTH_BRUTE_FORCE".equals(ruleId)
                        ? "Brute Force Attack Detected"
                        : "Suspicious Login Activity";
                String description = "Detected " + windowLogs.size() + " failed login attempts for " + scope
                        + " within " + windowMinutes + " minute" + (windowMinutes == 1 ? "" : "s") + ".";

                processSecurityRule(representative, new RuleMatch(
                        ruleId,
                        "Authentication",
                        title,
                        description,
                        severity,
                        windowLogs.size()
                ), windowLogs);

                windowLogs.stream()
                        .map(SecurityLog::getId)
                        .filter(StringUtils::hasText)
                        .forEach(alertedLogIds::add);
                return;
            }
        }
    }

    private void processAnomalousLog(SecurityLog log) {
        // Deduplication: Find an existing active alert for the same IP or Asset within the last hour
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        Query query = new Query();
        Criteria ipOrAsset = new Criteria().orOperator(
                Criteria.where("sourceIp").is(log.getIpAddress()),
                Criteria.where("relatedAssetId").is(log.getRelatedAssetId())
        );
        
        Criteria activeStatus = Criteria.where("status").in(ACTIVE_STATUSES);
        Criteria recentTimestamp = Criteria.where("updatedAt").gte(oneHourAgo);
        
        query.addCriteria(new Criteria().andOperator(ipOrAsset, activeStatus, recentTimestamp));
        
        Alert existingAlert = mongoTemplate.findOne(query, Alert.class);
        
        if (existingAlert != null) {
            // Deduplicate: append log ID
            if (existingAlert.getSourceLogIds() == null) {
                existingAlert.setSourceLogIds(new ArrayList<>());
            }
            if (!existingAlert.getSourceLogIds().contains(log.getId())) {
                existingAlert.getSourceLogIds().add(log.getId());
            }
            existingAlert.setUpdatedAt(LocalDateTime.now());
            
            // Optionally escalate severity if risk score is very high
            if (log.getRiskScore() != null && log.getRiskScore() >= 0.95 && !"CRITICAL".equals(existingAlert.getSeverity())) {
                existingAlert.setSeverity("CRITICAL");
            }
            
            alertRepository.save(existingAlert);
        } else {
            // Create a new alert
            Alert newAlert = Alert.builder()
                    .title("Anomalous Activity Detected: " + log.getSystemType())
                    .description("Detected anomalous behavior in log: " + log.getRawMessage())
                    .severity(determineSeverity(log.getRiskScore()))
                    .status("NEW")
                    .sourceIp(log.getIpAddress())
                    .relatedAssetId(log.getRelatedAssetId())
                    .sourceLogIds(new ArrayList<>(List.of(log.getId() != null ? log.getId() : "pending-id")))
                    .timestamp(log.getTimestamp() != null ? log.getTimestamp() : LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            
            alertRepository.save(newAlert);
            auditLogService.log("system", "system@sentinelcore.local", "ALERT_CREATED", "ALERT_MANAGEMENT", "Alert created: " + newAlert.getTitle());
        }
    }

    private void processSecurityRule(SecurityLog log, RuleMatch match) {
        processSecurityRule(log, match, List.of(log));
    }

    private void processSecurityRule(SecurityLog log, RuleMatch match, List<SecurityLog> sourceLogs) {
        processRuleAlert(
                match.ruleId(),
                match.category(),
                match.title(),
                match.description(),
                match.severity(),
                log.getIpAddress(),
                log.getRelatedAssetId(),
                sourceLogs.stream()
                        .map(SecurityLog::getId)
                        .filter(StringUtils::hasText)
                        .toList(),
                log.getTimestamp() != null ? log.getTimestamp() : LocalDateTime.now(),
                match.eventCount()
        );
    }

    private Alert processRuleAlert(
            String ruleId,
            String category,
            String title,
            String description,
            String severity,
            String sourceIp,
            String relatedAssetId,
            List<String> sourceLogIds,
            LocalDateTime timestamp,
            int eventCount
    ) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);

        List<Criteria> dedupeCriteria = new ArrayList<>();
        dedupeCriteria.add(Criteria.where("ruleId").is(ruleId));
        dedupeCriteria.add(Criteria.where("status").in(ACTIVE_STATUSES));
        dedupeCriteria.add(Criteria.where("updatedAt").gte(oneHourAgo));

        List<Criteria> identityCriteria = new ArrayList<>();
        if (StringUtils.hasText(sourceIp)) {
            identityCriteria.add(Criteria.where("sourceIp").is(sourceIp));
        }
        if (StringUtils.hasText(relatedAssetId)) {
            identityCriteria.add(Criteria.where("relatedAssetId").is(relatedAssetId));
        }
        if (!identityCriteria.isEmpty()) {
            dedupeCriteria.add(new Criteria().orOperator(identityCriteria.toArray(new Criteria[0])));
        } else {
            dedupeCriteria.add(Criteria.where("title").is(title));
        }

        Query query = new Query();
        query.addCriteria(new Criteria().andOperator(dedupeCriteria.toArray(new Criteria[0])));

        Alert existingAlert = mongoTemplate.findOne(query, Alert.class);
        if (existingAlert != null) {
            if (existingAlert.getSourceLogIds() == null) {
                existingAlert.setSourceLogIds(new ArrayList<>());
            }
            for (String sourceLogId : sourceLogIds) {
                if (!existingAlert.getSourceLogIds().contains(sourceLogId)) {
                    existingAlert.getSourceLogIds().add(sourceLogId);
                }
            }
            existingAlert.setDescription(description);
            existingAlert.setSeverity(highestSeverity(existingAlert.getSeverity(), severity));
            existingAlert.setEventCount(Math.max(existingAlert.getEventCount() == null ? 0 : existingAlert.getEventCount(), eventCount));
            existingAlert.setUpdatedAt(LocalDateTime.now());
            return alertRepository.save(existingAlert);
        }

        Alert newAlert = Alert.builder()
                .title(title)
                .description(description)
                .ruleId(ruleId)
                .category(category)
                .severity(severity)
                .status("NEW")
                .sourceIp(sourceIp)
                .relatedAssetId(relatedAssetId)
                .sourceLogIds(new ArrayList<>(sourceLogIds))
                .eventCount(eventCount)
                .timestamp(timestamp)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        alertRepository.save(newAlert);
        autoBlockIocsFromLogAndAlert(null, sourceIp, title, description);
        auditLogService.log("system", "system@sentinelcore.local", "ALERT_CREATED", "ALERT_MANAGEMENT", "Alert created: " + newAlert.getTitle());
        if (notificationService != null) {
            notificationService.notifyUpdate();
        }
        if (liveEventService != null) {
            liveEventService.broadcastEvent("Alert: " + newAlert.getTitle(), newAlert.getSeverity());
        }
        return newAlert;
    }

    private String determineSeverity(Double riskScore) {
        if (riskScore == null) return "MEDIUM";
        if (riskScore >= 0.90) return "CRITICAL";
        if (riskScore >= 0.70) return "HIGH";
        if (riskScore >= 0.40) return "MEDIUM";
        return "LOW";
    }

    public Page<Alert> getAlerts(String status, String severity, Pageable pageable) {
        return getAlerts(null, status, severity, pageable);
    }

    public Page<Alert> getAlerts(String search, String status, String severity, Pageable pageable) {
        Query query = new Query();
        List<Criteria> criteria = new ArrayList<>();

        if (StringUtils.hasText(search)) {
            Pattern pattern = Pattern.compile(Pattern.quote(search), Pattern.CASE_INSENSITIVE);
            criteria.add(new Criteria().orOperator(
                    Criteria.where("title").regex(pattern),
                    Criteria.where("description").regex(pattern),
                    Criteria.where("category").regex(pattern),
                    Criteria.where("ruleId").regex(pattern),
                    Criteria.where("sourceIp").regex(pattern)
            ));
        }

        if (StringUtils.hasText(status)) {
            criteria.add(Criteria.where("status").in(statusValuesForFilter(status)));
        }
        if (StringUtils.hasText(severity)) {
            criteria.add(Criteria.where("severity").is(severity));
        }

        if (!criteria.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteria.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(query, Alert.class);
        query.with(pageable);
        List<Alert> alerts = mongoTemplate.find(query, Alert.class);
        return new PageImpl<>(alerts, pageable, total);
    }

    public Alert getAlertById(String id) {
        return alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + id));
    }

    public Alert updateAlertStatus(String id, String status) {
        Alert alert = getAlertById(id);
        String normalizedStatus = normalizeStatus(status);
        alert.setStatus(normalizedStatus);
        alert.setUpdatedAt(LocalDateTime.now());
        Alert updatedAlert = alertRepository.save(alert);
        auditLogService.log("system", "system@sentinelcore.local", "ALERT_UPDATED", "ALERT_MANAGEMENT", "Alert status updated to " + normalizedStatus + " for alert: " + id);
        return updatedAlert;
    }

    public Alert acknowledgeAlert(String id) {
        return updateAlertStatus(id, "ACKNOWLEDGED");
    }

    public Alert dismissAlert(String id) {
        return updateAlertStatus(id, "DISMISSED");
    }

    public Alert resolveAlert(String id) {
        return updateAlertStatus(id, "RESOLVED");
    }

    public void processAuditAnomaly(String title, String description, String severity, String sourceIp) {
        processAuditRule("AUDIT_ANOMALY", "Audit", title, description, severity, sourceIp, 1);
    }

    public void processAuditRule(String ruleId, String category, String title, String description, String severity, String sourceIp, int eventCount) {
        // Deduplication for audit alerts
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        Query query = new Query();
        Criteria ipCriteria = Criteria.where("sourceIp").is(sourceIp);
        Criteria ruleCriteria = Criteria.where("ruleId").is(ruleId);
        Criteria activeStatus = Criteria.where("status").in(ACTIVE_STATUSES);
        Criteria recentTimestamp = Criteria.where("updatedAt").gte(oneHourAgo);
        
        query.addCriteria(new Criteria().andOperator(ipCriteria, ruleCriteria, activeStatus, recentTimestamp));
        
        Alert existingAlert = mongoTemplate.findOne(query, Alert.class);
        
        if (existingAlert != null) {
            existingAlert.setDescription(description);
            existingAlert.setUpdatedAt(LocalDateTime.now());
            existingAlert.setSeverity(highestSeverity(existingAlert.getSeverity(), severity));
            existingAlert.setEventCount(Math.max(existingAlert.getEventCount() == null ? 0 : existingAlert.getEventCount(), eventCount));
            alertRepository.save(existingAlert);
        } else {
            Alert newAlert = Alert.builder()
                    .title(title)
                    .description(description)
                    .ruleId(ruleId)
                    .category(category)
                    .severity(severity)
                    .status("NEW")
                    .sourceIp(sourceIp)
                    .eventCount(eventCount)
                    .timestamp(LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            alertRepository.save(newAlert);
            auditLogService.log("system", "system@sentinelcore.local", "ALERT_CREATED", "ALERT_MANAGEMENT", "Alert created: " + newAlert.getTitle());
        }
    }

    private boolean isFailedLoginLog(SecurityLog log) {
        String rawMessage = log.getRawMessage() == null ? "" : log.getRawMessage();
        return matchesAny(rawMessage, FAILED_LOGIN_PATTERNS);
    }

    private boolean matchesAny(String value, List<Pattern> patterns) {
        return patterns.stream().anyMatch(pattern -> pattern.matcher(value).find());
    }

    private String highestSeverity(String currentSeverity, String candidateSeverity) {
        return severityRank(candidateSeverity) > severityRank(currentSeverity) ? candidateSeverity : currentSeverity;
    }

    private int severityRank(String severity) {
        if ("CRITICAL".equalsIgnoreCase(severity)) return 4;
        if ("HIGH".equalsIgnoreCase(severity)) return 3;
        if ("MEDIUM".equalsIgnoreCase(severity)) return 2;
        if ("LOW".equalsIgnoreCase(severity)) return 1;
        return 0;
    }

    private String normalizeStatus(String status) {
        if (!StringUtils.hasText(status)) {
            throw new BadRequestException("Alert status is required.");
        }

        String normalized = status.trim().toUpperCase();
        if ("NEW".equals(normalized)) return "OPEN";
        if ("INVESTIGATING".equals(normalized)) return "ACKNOWLEDGED";
        if ("FALSE_POSITIVE".equals(normalized)) return "DISMISSED";

        if (!VALID_STATUSES.contains(normalized)) {
            throw new BadRequestException("Alert status must be OPEN, ACKNOWLEDGED, DISMISSED, or RESOLVED.");
        }
        return normalized;
    }

    private List<String> statusValuesForFilter(String status) {
        String normalized = normalizeStatus(status);
        if ("OPEN".equals(normalized)) {
            return List.of("OPEN", "NEW");
        }
        if ("ACKNOWLEDGED".equals(normalized)) {
            return List.of("ACKNOWLEDGED", "INVESTIGATING");
        }
        if ("DISMISSED".equals(normalized)) {
            return List.of("DISMISSED", "FALSE_POSITIVE");
        }
        return List.of(normalized);
    }

    private record RuleMatch(String ruleId, String category, String title, String description, String severity, int eventCount) {
    }
}
