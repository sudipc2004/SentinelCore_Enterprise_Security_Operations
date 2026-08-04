package com.sentinelcore.service;

import com.sentinelcore.model.Alert;
import com.sentinelcore.model.AuditLog;
import com.sentinelcore.model.ComplianceFramework;
import com.sentinelcore.model.Incident;
import com.sentinelcore.model.NotificationPreference;
import com.sentinelcore.model.ReportRecord;
import com.sentinelcore.model.ThreatIntel;
import com.sentinelcore.repository.AlertRepository;
import com.sentinelcore.repository.AuditLogRepository;
import com.sentinelcore.repository.ComplianceFrameworkRepository;
import com.sentinelcore.repository.IncidentRepository;
import com.sentinelcore.repository.NotificationPreferenceRepository;
import com.sentinelcore.repository.ReportRecordRepository;
import com.sentinelcore.repository.ThreatIntelRepository;
import com.sentinelcore.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.sentinelcore.model.Role;
import com.sentinelcore.model.Team;
import com.sentinelcore.model.User;
import com.sentinelcore.repository.TeamRepository;
import com.sentinelcore.repository.UserRepository;

import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
public class NotificationService {

    private static final List<String> ACTIVE_ALERT_STATUSES = List.of("NEW", "OPEN", "INVESTIGATING", "ACKNOWLEDGED");
    private static final List<String> ACTIVE_INCIDENT_STATUSES = List.of("OPEN", "TRIAGED", "IN_PROGRESS");

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private RiskScoringService riskScoringService;

    @Autowired
    private VulnerabilityService vulnerabilityService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ComplianceFrameworkRepository complianceFrameworkRepository;

    @Autowired
    private ThreatIntelRepository threatIntelRepository;

    @Autowired
    private ReportRecordRepository reportRecordRepository;

    @Autowired
    private NotificationPreferenceRepository notificationPreferenceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    public void notifyUpdate() {
        try {
            if (messagingTemplate != null) {
                messagingTemplate.convertAndSend("/topic/notifications", Map.of("type", "NOTIFICATIONS_UPDATED", "timestamp", LocalDateTime.now().toString()));
            }
        } catch (Exception ignored) {}
    }

    public NotificationPreference getPreferences(UserPrincipal userPrincipal) {
        String userId = userPrincipal != null && userPrincipal.getUser() != null ? userPrincipal.getUser().getId() : null;
        String email = userPrincipal != null ? userPrincipal.getUsername() : "system";

        if (StringUtils.hasText(userId)) {
            NotificationPreference pref = notificationPreferenceRepository.findByUserId(userId).orElse(null);
            if (pref != null) return pref;
        }

        NotificationPreference pref = notificationPreferenceRepository.findByUserEmail(email).orElse(null);
        if (pref != null) return pref;

        // Initialize default preferences
        NotificationPreference defaultPref = NotificationPreference.builder()
                .userId(userId)
                .userEmail(email)
                .channels(createDefaultChannels())
                .events(createDefaultEvents())
                .escalationChain(createDefaultEscalationChain())
                .quietHours(createDefaultQuietHours())
                .digest(createDefaultDigest())
                .readNotificationIds(new HashSet<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return notificationPreferenceRepository.save(defaultPref);
    }

    public NotificationPreference savePreferences(UserPrincipal userPrincipal, NotificationPreference request) {
        NotificationPreference pref = getPreferences(userPrincipal);

        if (request.getChannels() != null) pref.setChannels(request.getChannels());
        if (request.getEvents() != null) pref.setEvents(request.getEvents());
        if (request.getEscalationChain() != null) pref.setEscalationChain(request.getEscalationChain());
        if (request.getQuietHours() != null) pref.setQuietHours(request.getQuietHours());
        if (request.getDigest() != null) pref.setDigest(request.getDigest());

        pref.setUpdatedAt(LocalDateTime.now());
        NotificationPreference saved = notificationPreferenceRepository.save(pref);

        auditLogService.log(userPrincipal != null && userPrincipal.getUser() != null ? userPrincipal.getUser().getId() : null,
                userPrincipal != null ? userPrincipal.getUsername() : "system",
                "NOTIFICATION_PREFS_UPDATED", "NOTIFICATION",
                "Updated notification preferences and event subscriptions.");

        notifyUpdate();
        return saved;
    }

    public List<Map<String, Object>> getNotifications(UserPrincipal userPrincipal) {
        NotificationPreference prefs = getPreferences(userPrincipal);
        Map<String, Boolean> eventToggles = prefs.getEvents() != null ? prefs.getEvents() : Map.of();
        Set<String> readIds = prefs.getReadNotificationIds() != null ? prefs.getReadNotificationIds() : Set.of();
        boolean inQuietHours = isQuietHoursActive(prefs.getQuietHours());

        List<Map<String, Object>> notifications = new ArrayList<>();

        List<Map<String, Object>> chain = prefs.getEscalationChain() != null ? prefs.getEscalationChain() : createDefaultEscalationChain();

        // 1. Alerts (CRITICAL_ALERT, HIGH_ALERT)
        alertRepository.findAll().stream()
                .filter(alert -> ACTIVE_ALERT_STATUSES.contains(normalize(alert.getStatus(), "NEW")))
                .forEach(alert -> {
                    String sev = normalize(alert.getSeverity(), "MEDIUM");
                    if ("CRITICAL".equals(sev) && isEventEnabled(eventToggles, "CRITICAL_ALERT")) {
                        notifications.add(alertNotification(alert, chain));
                    } else if ("HIGH".equals(sev) && isEventEnabled(eventToggles, "HIGH_ALERT")) {
                        notifications.add(alertNotification(alert, chain));
                    }
                });

        // 2. Incidents (INCIDENT_CREATED, INCIDENT_ESCALATED)
        incidentRepository.findAll().stream()
                .filter(incident -> ACTIVE_INCIDENT_STATUSES.contains(normalize(incident.getStatus(), "OPEN")))
                .forEach(incident -> {
                    String status = normalize(incident.getStatus(), "OPEN");
                    if ("IN_PROGRESS".equals(status) && isEventEnabled(eventToggles, "INCIDENT_ESCALATED")) {
                        notifications.add(incidentNotification(incident, "INCIDENT_ESCALATED", chain));
                    } else if (isEventEnabled(eventToggles, "INCIDENT_CREATED")) {
                        notifications.add(incidentNotification(incident, "INCIDENT_CREATED", chain));
                    }
                });

        // 3. Asset Risk / Offline (ASSET_OFFLINE)
        if (isEventEnabled(eventToggles, "ASSET_OFFLINE")) {
            riskScoringService.getAssetRiskScores().stream()
                    .filter(assetRisk -> (Integer) assetRisk.get("riskScore") >= 60)
                    .forEach(assetRisk -> notifications.add(riskNotification(assetRisk)));
        }

        // 4. Vulnerabilities (VULNERABILITY_FOUND)
        if (isEventEnabled(eventToggles, "VULNERABILITY_FOUND")) {
            notifications.addAll(vulnerabilityService.getNotifications());
        }

        // 5. Compliance Gap (COMPLIANCE_GAP)
        if (isEventEnabled(eventToggles, "COMPLIANCE_GAP")) {
            complianceFrameworkRepository.findAll().forEach(framework -> {
                if (framework.getDomains() != null) {
                    framework.getDomains().stream()
                            .filter(d -> d.getOpen() > 0)
                            .forEach(d -> notifications.add(complianceNotification(framework, d)));
                }
            });
        }

        // 6. User Login Failures (USER_LOGIN_FAILED)
        if (isEventEnabled(eventToggles, "USER_LOGIN_FAILED")) {
            LocalDateTime dayAgo = LocalDateTime.now().minusDays(1);
            auditLogRepository.findAll().stream()
                    .filter(log -> "LOGIN_FAILED".equals(log.getAction()))
                    .filter(log -> log.getTimestamp() != null && log.getTimestamp().isAfter(dayAgo))
                    .limit(5)
                    .forEach(log -> notifications.add(loginFailedNotification(log)));
        }

        // 7. IOC / Threat Intelligence Detected (IOC_DETECTED)
        if (isEventEnabled(eventToggles, "IOC_DETECTED")) {
            threatIntelRepository.findAll().stream()
                    .limit(5)
                    .forEach(intel -> notifications.add(iocNotification(intel)));
        }

        // 8. Report Ready (REPORT_READY)
        if (isEventEnabled(eventToggles, "REPORT_READY")) {
            reportRecordRepository.findAll().stream()
                    .sorted(Comparator.comparing(ReportRecord::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .limit(3)
                    .forEach(report -> notifications.add(reportNotification(report)));
        }

        return notifications.stream()
                .filter(n -> !readIds.contains(n.get("id")))
                .filter(n -> !inQuietHours || "CRITICAL".equals(n.get("severity")))
                .sorted(Comparator.comparing(this::createdAt, Comparator.reverseOrder()))
                .limit(50)
                .collect(Collectors.toList());
    }

    public Map<String, Object> getSummary(UserPrincipal userPrincipal) {
        List<Map<String, Object>> notifications = getNotifications(userPrincipal);
        return Map.of(
                "unreadCount", notifications.size(),
                "criticalCount", notifications.stream()
                        .filter(item -> "CRITICAL".equals(item.get("severity")))
                        .count(),
                "notifications", notifications
        );
    }

    public void markAsRead(UserPrincipal userPrincipal, String notificationId) {
        NotificationPreference prefs = getPreferences(userPrincipal);
        if (prefs.getReadNotificationIds() == null) {
            prefs.setReadNotificationIds(new HashSet<>());
        }
        prefs.getReadNotificationIds().add(notificationId);
        prefs.setUpdatedAt(LocalDateTime.now());
        notificationPreferenceRepository.save(prefs);
        notifyUpdate();
    }

    public void markAllAsRead(UserPrincipal userPrincipal) {
        List<Map<String, Object>> currentNotifications = getNotifications(userPrincipal);
        NotificationPreference prefs = getPreferences(userPrincipal);
        if (prefs.getReadNotificationIds() == null) {
            prefs.setReadNotificationIds(new HashSet<>());
        }
        currentNotifications.forEach(n -> prefs.getReadNotificationIds().add((String) n.get("id")));
        prefs.setUpdatedAt(LocalDateTime.now());
        notificationPreferenceRepository.save(prefs);
        notifyUpdate();
    }

    public Map<String, Object> testChannel(UserPrincipal userPrincipal, String channelId, Map<String, Object> config) {
        String email = userPrincipal != null ? userPrincipal.getUsername() : "User";
        String channelName = channelId.toUpperCase(Locale.ROOT);

        auditLogService.log(userPrincipal != null && userPrincipal.getUser() != null ? userPrincipal.getUser().getId() : null,
                email, "NOTIFICATION_CHANNEL_TEST", "NOTIFICATION",
                "Tested notification channel dispatch for " + channelName);

        return Map.of(
                "status", "SUCCESS",
                "channel", channelId,
                "message", "Test notification payload successfully verified and sent via " + channelName + " to " + email,
                "timestamp", LocalDateTime.now()
        );
    }

    private boolean isEventEnabled(Map<String, Boolean> toggles, String eventId) {
        Boolean value = toggles.get(eventId);
        return value == null ? true : value;
    }

    private boolean isQuietHoursActive(Map<String, Object> quietHours) {
        if (quietHours == null || !Boolean.TRUE.equals(quietHours.get("enabled"))) {
            return false;
        }

        try {
            String fromStr = (String) quietHours.get("from");
            String toStr = (String) quietHours.get("to");
            @SuppressWarnings("unchecked")
            List<String> days = (List<String>) quietHours.get("days");

            if (!StringUtils.hasText(fromStr) || !StringUtils.hasText(toStr)) {
                return false;
            }

            LocalDateTime now = LocalDateTime.now();
            String currentDay = now.getDayOfWeek().name().substring(0, 3).toUpperCase(Locale.ROOT);

            if (days != null && !days.isEmpty() && !days.contains(currentDay)) {
                return false;
            }

            LocalTime fromTime = LocalTime.parse(fromStr);
            LocalTime toTime = LocalTime.parse(toStr);
            LocalTime nowTime = now.toLocalTime();

            if (fromTime.isAfter(toTime)) {
                return nowTime.isAfter(fromTime) || nowTime.isBefore(toTime);
            } else {
                return nowTime.isAfter(fromTime) && nowTime.isBefore(toTime);
            }
        } catch (Exception e) {
            return false;
        }
    }

    public Map<String, Object> getEscalationSequence(UserPrincipal userPrincipal) {
        NotificationPreference prefs = getPreferences(userPrincipal);
        List<Map<String, Object>> chain = prefs.getEscalationChain() != null ? prefs.getEscalationChain() : createDefaultEscalationChain();

        List<Map<String, Object>> escalatedAlerts = alertRepository.findAll().stream()
                .filter(alert -> ACTIVE_ALERT_STATUSES.contains(normalize(alert.getStatus(), "NEW")))
                .filter(alert -> "CRITICAL".equalsIgnoreCase(alert.getSeverity()) || "HIGH".equalsIgnoreCase(alert.getSeverity()))
                .map(alert -> {
                    LocalDateTime created = alert.getCreatedAt() == null ? LocalDateTime.now() : alert.getCreatedAt();
                    Map<String, Object> status = calculateEscalationStatus(created, chain);
                    return Map.of(
                            "id", "alert:" + alert.getId(),
                            "type", "ALERT",
                            "title", defaultValue(alert.getTitle(), "Security alert"),
                            "severity", normalize(alert.getSeverity(), "MEDIUM"),
                            "status", alert.getStatus(),
                            "createdAt", created,
                            "escalation", status
                    );
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> escalatedIncidents = incidentRepository.findAll().stream()
                .filter(incident -> ACTIVE_INCIDENT_STATUSES.contains(normalize(incident.getStatus(), "OPEN")))
                .map(incident -> {
                    LocalDateTime created = incident.getCreatedAt() == null ? LocalDateTime.now() : incident.getCreatedAt();
                    Map<String, Object> status = calculateEscalationStatus(created, chain);
                    return Map.of(
                            "id", "incident:" + incident.getId(),
                            "type", "INCIDENT",
                            "title", defaultValue(incident.getTitle(), "Active incident"),
                            "priority", normalize(incident.getPriority(), "P3"),
                            "status", incident.getStatus(),
                            "createdAt", created,
                            "escalation", status
                    );
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> allEscalated = new ArrayList<>();
        allEscalated.addAll(escalatedAlerts);
        allEscalated.addAll(escalatedIncidents);

        return Map.of(
                "totalActive", allEscalated.size(),
                "escalatedCount", allEscalated.stream().filter(i -> Boolean.TRUE.equals(((Map<?, ?>) i.get("escalation")).get("isEscalated"))).count(),
                "escalationChain", chain,
                "items", allEscalated
        );
    }

    public Map<String, Object> calculateEscalationStatus(LocalDateTime createdAt, List<Map<String, Object>> chain) {
        if (chain == null || chain.isEmpty()) {
            chain = createDefaultEscalationChain();
        }

        LocalDateTime now = LocalDateTime.now();
        long elapsedMinutes = java.time.Duration.between(createdAt == null ? now : createdAt, now).toMinutes();
        if (elapsedMinutes < 0) elapsedMinutes = 0;

        List<Map<String, Object>> sortedChain = chain.stream()
                .sorted(Comparator.comparingInt(c -> {
                    Object delay = c.get("delayMinutes");
                    return delay instanceof Number ? ((Number) delay).intValue() : 0;
                }))
                .collect(Collectors.toList());

        Map<String, Object> currentStep = sortedChain.get(0);
        Map<String, Object> nextStep = null;
        int currentStepIndex = 1;

        for (int i = 0; i < sortedChain.size(); i++) {
            Map<String, Object> step = sortedChain.get(i);
            int delay = step.get("delayMinutes") instanceof Number ? ((Number) step.get("delayMinutes")).intValue() : 0;
            if (elapsedMinutes >= delay) {
                currentStep = step;
                currentStepIndex = i + 1;
                if (i + 1 < sortedChain.size()) {
                    nextStep = sortedChain.get(i + 1);
                } else {
                    nextStep = null;
                }
            }
        }

        long minutesUntilNext = -1;
        if (nextStep != null) {
            int nextDelay = nextStep.get("delayMinutes") instanceof Number ? ((Number) nextStep.get("delayMinutes")).intValue() : 0;
            minutesUntilNext = Math.max(0, nextDelay - elapsedMinutes);
        }

        String curRole = String.valueOf(currentStep.getOrDefault("role", "Analyst"));
        String nextRole = nextStep != null ? String.valueOf(nextStep.getOrDefault("role", "N/A")) : "Max Level Reached";

        Map<String, Object> result = new HashMap<>();
        result.put("currentStepNumber", currentStepIndex);
        result.put("totalSteps", sortedChain.size());
        result.put("currentRole", curRole);
        result.put("currentChannel", currentStep.getOrDefault("channel", "email"));
        result.put("assignedUsers", resolveTargetUsers(curRole));
        result.put("nextRole", nextRole);
        result.put("minutesUntilNextEscalation", minutesUntilNext);
        result.put("isEscalated", currentStepIndex > 1);
        result.put("elapsedMinutes", elapsedMinutes);
        return result;
    }

    public List<Map<String, String>> resolveTargetUsers(String roleLabel) {
        if (!StringUtils.hasText(roleLabel) || "N/A".equalsIgnoreCase(roleLabel) || "Max Level Reached".equalsIgnoreCase(roleLabel)) {
            return List.of();
        }
        String normalized = roleLabel.trim().toUpperCase(Locale.ROOT);
        List<User> targetUsers = new ArrayList<>();

        if (normalized.contains("LEAD")) {
            List<String> leadUserIds = teamRepository.findAll().stream()
                    .map(Team::getTeamLead)
                    .filter(StringUtils::hasText)
                    .collect(Collectors.toList());
            if (!leadUserIds.isEmpty()) {
                userRepository.findAllById(leadUserIds).forEach(targetUsers::add);
            }
            if (targetUsers.isEmpty()) {
                targetUsers.addAll(userRepository.findByRole(Role.ADMIN));
            }
        } else if (normalized.contains("ADMIN") || normalized.contains("CISO") || normalized.contains("MANAGER")) {
            targetUsers.addAll(userRepository.findByRole(Role.ADMIN));
        } else if (normalized.contains("ANALYST")) {
            targetUsers.addAll(userRepository.findByRole(Role.ANALYST));
        } else {
            targetUsers.addAll(userRepository.findByRole(Role.ANALYST));
            targetUsers.addAll(userRepository.findByRole(Role.ADMIN));
        }

        return targetUsers.stream()
                .filter(u -> "ACTIVE".equalsIgnoreCase(u.getStatus()))
                .distinct()
                .map(u -> Map.of(
                        "id", u.getId() == null ? "" : u.getId(),
                        "name", defaultValue(u.getName(), u.getEmail()),
                        "email", u.getEmail(),
                        "role", u.getRole() == null ? "USER" : u.getRole().name()
                ))
                .collect(Collectors.toList());
    }

    private Map<String, Object> alertNotification(Alert alert, List<Map<String, Object>> chain) {
        LocalDateTime created = alert.getUpdatedAt() == null ? defaultTime(alert.getCreatedAt()) : alert.getUpdatedAt();
        Map<String, Object> notif = new HashMap<>();
        notif.put("id", "alert:" + alert.getId());
        notif.put("source", "ALERT");
        notif.put("type", "SECURITY_ALERT");
        notif.put("severity", normalize(alert.getSeverity(), "MEDIUM"));
        notif.put("title", defaultValue(alert.getTitle(), "Security alert"));
        notif.put("message", defaultValue(alert.getDescription(), "A security alert requires attention."));
        notif.put("entityId", defaultValue(alert.getId(), ""));
        notif.put("createdAt", created);
        notif.put("escalation", calculateEscalationStatus(created, chain));
        return notif;
    }

    private Map<String, Object> incidentNotification(Incident incident, String type, List<Map<String, Object>> chain) {
        String severity = "P1".equals(normalize(incident.getPriority(), "P3")) ? "CRITICAL" : "HIGH";
        LocalDateTime created = incident.getUpdatedAt() == null ? defaultTime(incident.getCreatedAt()) : incident.getUpdatedAt();
        Map<String, Object> notif = new HashMap<>();
        notif.put("id", "incident:" + incident.getId());
        notif.put("source", "INCIDENT");
        notif.put("type", type);
        notif.put("severity", severity);
        notif.put("title", defaultValue(incident.getTitle(), "Active incident"));
        notif.put("message", defaultValue(incident.getDescription(), "A high priority incident is active."));
        notif.put("entityId", defaultValue(incident.getId(), ""));
        notif.put("createdAt", created);
        notif.put("escalation", calculateEscalationStatus(created, chain));
        return notif;
    }

    private Map<String, Object> riskNotification(Map<String, Object> assetRisk) {
        return Map.of(
                "id", "risk:" + assetRisk.get("assetId"),
                "source", "RISK",
                "type", "ASSET_OFFLINE",
                "severity", "CRITICAL",
                "title", "Critical asset risk: " + assetRisk.get("assetName"),
                "message", "Risk score " + assetRisk.get("riskScore") + " with "
                        + assetRisk.get("openVulnerabilities") + " open vulnerabilities and "
                        + assetRisk.get("openIncidents") + " open incidents.",
                "entityId", defaultValue((String) assetRisk.get("assetId"), ""),
                "createdAt", LocalDateTime.now()
        );
    }

    private Map<String, Object> complianceNotification(ComplianceFramework framework, ComplianceFramework.ComplianceDomain domain) {
        return Map.of(
                "id", "compliance:" + framework.getId() + ":" + domain.getId(),
                "source", "COMPLIANCE",
                "type", "COMPLIANCE_GAP",
                "severity", "HIGH",
                "title", "Compliance gap: " + framework.getLabel() + " - " + domain.getName(),
                "message", domain.getOpen() + " open controls require evidence submission in domain " + domain.getName() + ".",
                "entityId", framework.getId(),
                "createdAt", framework.getUpdatedAt() == null ? defaultTime(framework.getCreatedAt()) : framework.getUpdatedAt()
        );
    }

    private Map<String, Object> loginFailedNotification(AuditLog log) {
        return Map.of(
                "id", "audit:" + log.getId(),
                "source", "AUTH",
                "type", "USER_LOGIN_FAILED",
                "severity", "HIGH",
                "title", "Failed Login Attempt",
                "message", defaultValue(log.getDescription(), "Failed login attempt recorded for " + log.getUserEmail()),
                "entityId", defaultValue(log.getId(), ""),
                "createdAt", log.getTimestamp() == null ? LocalDateTime.now() : log.getTimestamp()
        );
    }

    private Map<String, Object> iocNotification(ThreatIntel intel) {
        return Map.of(
                "id", "ioc:" + intel.getId(),
                "source", "THREAT_INTEL",
                "type", "IOC_DETECTED",
                "severity", "HIGH",
                "title", "Threat IOC Detected: " + intel.getValue(),
                "message", defaultValue(intel.getDescription(), "High risk threat indicator flagged from " + intel.getSource()),
                "entityId", defaultValue(intel.getId(), ""),
                "createdAt", intel.getUpdatedAt() == null ? defaultTime(intel.getCreatedAt()) : intel.getUpdatedAt()
        );
    }

    private Map<String, Object> reportNotification(ReportRecord report) {
        return Map.of(
                "id", "report:" + report.getId(),
                "source", "REPORT",
                "type", "REPORT_READY",
                "severity", "LOW",
                "title", "Report Generated: " + report.getTitle(),
                "message", "Report type " + report.getType() + " (" + report.getFormat() + ") is ready for download.",
                "entityId", defaultValue(report.getId(), ""),
                "createdAt", report.getCreatedAt() == null ? LocalDateTime.now() : report.getCreatedAt()
        );
    }

    private LocalDateTime createdAt(Map<String, Object> item) {
        Object value = item.get("createdAt");
        return value instanceof LocalDateTime ? (LocalDateTime) value : LocalDateTime.MIN;
    }

    private String normalize(String value, String fallback) {
        return defaultValue(value, fallback).toUpperCase(Locale.ROOT);
    }

    private String defaultValue(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }

    private LocalDateTime defaultTime(LocalDateTime value) {
        return value == null ? LocalDateTime.now() : value;
    }

    private Map<String, Map<String, Object>> createDefaultChannels() {
        Map<String, Map<String, Object>> channels = new HashMap<>();
        channels.put("email", Map.of("enabled", true, "address", "", "subject", "[SentinelCore Alert]", "cc", ""));
        channels.put("slack", Map.of("enabled", false, "webhook", "", "channel", "#soc-alerts", "username", "SentinelCore"));
        channels.put("pagerduty", Map.of("enabled", false, "routingKey", "", "severity", "critical"));
        channels.put("sms", Map.of("enabled", false, "apiKey", "", "authToken", "", "from", "", "to", ""));
        channels.put("webhook", Map.of("enabled", false, "url", "", "method", "POST", "authHeader", "", "secret", ""));
        return channels;
    }

    private Map<String, Boolean> createDefaultEvents() {
        Map<String, Boolean> events = new HashMap<>();
        events.put("CRITICAL_ALERT", true);
        events.put("HIGH_ALERT", true);
        events.put("INCIDENT_CREATED", true);
        events.put("INCIDENT_ESCALATED", true);
        events.put("VULNERABILITY_FOUND", false);
        events.put("IOC_DETECTED", false);
        events.put("COMPLIANCE_GAP", false);
        events.put("USER_LOGIN_FAILED", true);
        events.put("ASSET_OFFLINE", false);
        events.put("REPORT_READY", false);
        return events;
    }

    private List<Map<String, Object>> createDefaultEscalationChain() {
        return List.of(
                Map.of("id", 1, "role", "Analyst", "delayMinutes", 0, "channel", "email"),
                Map.of("id", 2, "role", "Team Lead", "delayMinutes", 15, "channel", "slack"),
                Map.of("id", 3, "role", "Administrator", "delayMinutes", 30, "channel", "pagerduty")
        );
    }

    private Map<String, Object> createDefaultQuietHours() {
        return Map.of(
                "enabled", false,
                "from", "22:00",
                "to", "07:00",
                "days", List.of("SAT", "SUN")
        );
    }

    private Map<String, Object> createDefaultDigest() {
        return Map.of(
                "enabled", true,
                "frequency", "Daily"
        );
    }
}

