package com.sentinelcore.service;

import com.sentinelcore.dto.IncidentResponse;
import com.sentinelcore.dto.UserResponse;
import com.sentinelcore.model.AuditLog;
import com.sentinelcore.model.Alert;
import com.sentinelcore.model.Asset;
import com.sentinelcore.model.Incident;
import com.sentinelcore.model.SecurityLog;
import com.sentinelcore.model.Team;
import com.sentinelcore.model.ThreatIntel;
import com.sentinelcore.model.User;
import com.sentinelcore.repository.AssetRepository;
import com.sentinelcore.repository.TeamRepository;
import com.sentinelcore.repository.UserRepository;
import com.sentinelcore.repository.IncidentRepository;
import com.sentinelcore.repository.SecurityLogRepository;
import com.sentinelcore.repository.ThreatIntelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import com.sentinelcore.repository.VulnerabilityRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.sentinelcore.repository.AlertRepository;
import java.util.Comparator;
import java.util.UUID;

@Service
public class DashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private SecurityLogRepository securityLogRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private ThreatIntelRepository threatIntelRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private VulnerabilityRepository vulnerabilityRepository;

    @Autowired
    private RiskScoringService riskScoringService;

    public Map<String, Object> getDashboardStats(String currentUserId) {
        Map<String, Object> stats = new HashMap<>();

        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus("ACTIVE");
        long totalTeams = teamRepository.count();
        long totalIncidents = incidentRepository.count();
        long openIncidents = incidentRepository.countByStatus("OPEN")
                + incidentRepository.countByStatus("TRIAGED")
                + incidentRepository.countByStatus("IN_PROGRESS");
        long totalAssets = assetRepository.count();
        long onlineAssets = assetRepository.countByStatus("ONLINE");
        long totalLogs = securityLogRepository.count();
        long anomalyLogs = securityLogRepository.countByAnomaly(true);
        long totalThreatIntel = threatIntelRepository.count();
        long totalVulnerabilities = vulnerabilityRepository.count();
        long openVulnerabilities = vulnerabilityRepository.countByStatus("NEW")
                + vulnerabilityRepository.countByStatus("ASSIGNED")
                + vulnerabilityRepository.countByStatus("IN_PROGRESS")
                + vulnerabilityRepository.countByStatus("UNDER_REVIEW");
        List<Map<String, Object>> alertStatusCounts = getAlertStatusCounts();
        List<Map<String, Object>> severityDistribution = getSeverityDistribution();
        List<Map<String, Object>> incidentTrend = getIncidentTrend();
        Double avgMttrHours = getAvgMttrHours();

        // Recent users (last 5)
        Query recentUsersQuery = new Query().with(Sort.by(Sort.Direction.DESC, "createdAt")).limit(5);
        List<User> recentUsers = mongoTemplate.find(recentUsersQuery, User.class);
        List<UserResponse> recentUserResponses = recentUsers.stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());

        // Recent teams (last 5)
        Query recentTeamsQuery = new Query().with(Sort.by(Sort.Direction.DESC, "createdAt")).limit(5);
        List<Team> recentTeams = mongoTemplate.find(recentTeamsQuery, Team.class);

        Query recentAssetsQuery = new Query().with(Sort.by(Sort.Direction.DESC, "updatedAt")).limit(5);
        List<Asset> recentAssets = mongoTemplate.find(recentAssetsQuery, Asset.class);

        Query recentThreatIntelQuery = new Query().with(Sort.by(Sort.Direction.DESC, "createdAt")).limit(5);
        List<ThreatIntel> recentThreatIntel = mongoTemplate.find(recentThreatIntelQuery, ThreatIntel.class);

        Query recentAnomalyLogsQuery = new Query(Criteria.where("anomaly").is(true))
                .with(Sort.by(Sort.Direction.DESC, "timestamp")).limit(5);
        List<SecurityLog> recentAnomalyLogs = mongoTemplate.find(recentAnomalyLogsQuery, SecurityLog.class);

        // Recent login activity (last 5 login events)
        Query recentLoginsQuery = new Query(
                Criteria.where("action").in("LOGIN_SUCCESS", "LOGIN_FAILED")
        ).with(Sort.by(Sort.Direction.DESC, "timestamp")).limit(5);
        List<AuditLog> recentLogins = mongoTemplate.find(recentLoginsQuery, AuditLog.class);

        Criteria myIncidentCriteria = Criteria.where("assignedTo").is(currentUserId)
                .and("status").in("OPEN", "TRIAGED", "IN_PROGRESS");
        long myAssignedIncidentCount = mongoTemplate.count(new Query(myIncidentCriteria), Incident.class);
        Query myIncidentsQuery = new Query(
                Criteria.where("assignedTo").is(currentUserId)
                        .and("status").in("OPEN", "TRIAGED", "IN_PROGRESS")
        ).with(Sort.by(Sort.Direction.ASC, "dueAt")).limit(5);
        List<IncidentResponse> myAssignedIncidents = mongoTemplate.find(myIncidentsQuery, Incident.class).stream()
                .map(incident -> IncidentResponse.fromIncident(incident, null))
                .collect(Collectors.toList());

        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("totalTeams", totalTeams);
        stats.put("totalIncidents", totalIncidents);
        stats.put("openIncidents", openIncidents);
        stats.put("totalAssets", totalAssets);
        stats.put("onlineAssets", onlineAssets);
        stats.put("totalLogs", totalLogs);
        stats.put("anomalyLogs", anomalyLogs);
        stats.put("totalThreatIntel", totalThreatIntel);
        stats.put("totalVulnerabilities", totalVulnerabilities);
        stats.put("openVulnerabilities", openVulnerabilities);
        stats.put("alertStatusCounts", alertStatusCounts);
        stats.put("severityDistribution", severityDistribution);
        stats.put("incidentTrend", incidentTrend);
        stats.put("avgMttrHours", avgMttrHours);
        stats.put("recentUsers", recentUserResponses);
        stats.put("recentTeams", recentTeams);
        stats.put("recentAssets", recentAssets);
        stats.put("recentThreatIntel", recentThreatIntel);
        stats.put("recentAnomalyLogs", recentAnomalyLogs);
        stats.put("recentLogins", recentLogins);
        stats.put("myAssignedIncidents", myAssignedIncidents);
        stats.put("myAssignedIncidentCount", myAssignedIncidentCount);
        stats.put("liveEventsFeed", getRecentLiveEvents());
        stats.putAll(riskScoringService.getRiskSummary());

        return stats;
    }

    public List<Map<String, Object>> getRecentLiveEvents() {
        List<Map<String, Object>> events = new ArrayList<>();

        // 1. Security Logs (recent 15)
        securityLogRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp")).stream()
                .limit(15)
                .forEach(log -> events.add(Map.of(
                        "_id", "log:" + (log.getId() == null ? UUID.randomUUID().toString() : log.getId()),
                        "message", log.getRawMessage() != null ? log.getRawMessage() : "Security Log Event from " + (log.getIpAddress() != null ? log.getIpAddress() : "network"),
                        "severity", log.isAnomaly() ? "HIGH" : "INFO",
                        "source", log.getSystemType() != null ? log.getSystemType() : "SYSTEM",
                        "timestamp", log.getTimestamp() != null ? log.getTimestamp() : LocalDateTime.now()
                )));

        // 2. Alerts (recent 10)
        alertRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .limit(10)
                .forEach(alert -> events.add(Map.of(
                        "_id", "alert:" + (alert.getId() == null ? UUID.randomUUID().toString() : alert.getId()),
                        "message", "Alert: " + (alert.getTitle() != null ? alert.getTitle() : alert.getDescription()),
                        "severity", alert.getSeverity() != null ? alert.getSeverity() : "MEDIUM",
                        "source", "ALERT",
                        "timestamp", alert.getCreatedAt() != null ? alert.getCreatedAt() : LocalDateTime.now()
                )));

        // 3. Audit Logs (logins / user actions - recent 10)
        Query auditQuery = new Query().with(Sort.by(Sort.Direction.DESC, "timestamp")).limit(10);
        mongoTemplate.find(auditQuery, AuditLog.class).forEach(log -> events.add(Map.of(
                "_id", "audit:" + (log.getId() == null ? UUID.randomUUID().toString() : log.getId()),
                "message", "Audit: " + (log.getDescription() != null ? log.getDescription() : log.getAction()),
                "severity", "LOGIN_FAILED".equals(log.getAction()) ? "HIGH" : "INFO",
                "source", "AUTH",
                "timestamp", log.getTimestamp() != null ? log.getTimestamp() : LocalDateTime.now()
        )));

        return events.stream()
                .sorted(Comparator.comparing(e -> (LocalDateTime) e.get("timestamp"), Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(30)
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> getAlertStatusCounts() {
        return List.of(
                Map.of("status", "Open", "count", countAlertsByStatuses("OPEN", "NEW")),
                Map.of("status", "Acknowledged", "count", countAlertsByStatuses("ACKNOWLEDGED", "INVESTIGATING")),
                Map.of("status", "Dismissed", "count", countAlertsByStatuses("DISMISSED", "FALSE_POSITIVE")),
                Map.of("status", "Resolved", "count", countAlertsByStatuses("RESOLVED"))
        );
    }

    private List<Map<String, Object>> getSeverityDistribution() {
        return List.of(
                Map.of("name", "P1 Critical", "value", countIncidentsByPriority("P1")),
                Map.of("name", "P2 High", "value", countIncidentsByPriority("P2")),
                Map.of("name", "P3 Medium", "value", countIncidentsByPriority("P3")),
                Map.of("name", "P4 Low", "value", countIncidentsByPriority("P4"))
        );
    }

    private List<Map<String, Object>> getIncidentTrend() {
        List<Map<String, Object>> trend = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 6; i >= 0; i--) {
            LocalDate day = today.minusDays(i);
            LocalDateTime start = day.atStartOfDay();
            LocalDateTime end = day.plusDays(1).atStartOfDay();

            Criteria incidentCriteria = Criteria.where("createdAt").gte(start).lt(end);
            Criteria alertCriteria = Criteria.where("createdAt").gte(start).lt(end);

            long incidents = mongoTemplate.count(new Query(incidentCriteria), Incident.class);
            long alerts = mongoTemplate.count(new Query(alertCriteria), Alert.class);

            trend.add(Map.of(
                    "day", day.getDayOfWeek().toString().substring(0, 3),
                    "incidents", incidents,
                    "alerts", alerts
            ));
        }

        return trend;
    }

    private Double getAvgMttrHours() {
        Query resolvedQuery = new Query(Criteria.where("resolvedAt").ne(null));
        List<Incident> resolvedIncidents = mongoTemplate.find(resolvedQuery, Incident.class);
        if (resolvedIncidents.isEmpty()) {
            return null;
        }

        double totalHours = resolvedIncidents.stream()
                .filter(incident -> incident.getCreatedAt() != null && incident.getResolvedAt() != null)
                .mapToLong(incident -> ChronoUnit.MINUTES.between(incident.getCreatedAt(), incident.getResolvedAt()))
                .average()
                .orElse(0);

        return Math.round((totalHours / 60.0) * 10.0) / 10.0;
    }

    private long countIncidentsByPriority(String priority) {
        return mongoTemplate.count(new Query(Criteria.where("priority").is(priority)), Incident.class);
    }

    private long countAlertsByStatuses(String... statuses) {
        return mongoTemplate.count(new Query(Criteria.where("status").in((Object[]) statuses)), Alert.class);
    }
}
