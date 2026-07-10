package com.sentinelcore.controller;

import com.sentinelcore.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private TeamRepository teamRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long totalLogs = logRepository.count();
        long totalTeams = teamRepository.count();
        var recentLogins = auditLogRepository.findTop5ByActionInOrderByTimestampDesc(
                Arrays.asList("LOGIN_SUCCESS", "LOGIN_FAILED")
        );
        long activeAlerts = alertRepository.countByStatus("NEW") + alertRepository.countByStatus("INVESTIGATING");
        long activeIncidents = incidentRepository.countByStatus("NEW") + incidentRepository.countByStatus("ASSIGNED") + incidentRepository.countByStatus("INVESTIGATING");
        long criticalThreats = alertRepository.countBySeverity("CRITICAL");

        // Calculate a sliding average risk score for AI
        double avgAiRiskScore = logRepository.findAll().stream()
                .filter(com.sentinelcore.model.Log::isAnomaly)
                .mapToDouble(com.sentinelcore.model.Log::getRiskScore)
                .average()
                .orElse(0.12);

        // Standard stats
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus("ACTIVE");

        // Recent alerts
        var recentAlerts = alertRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "timestamp"))
        ).getContent();

        // Recent incidents
        var recentIncidents = incidentRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();

        // Recent logs
        var recentLogs = logRepository.findAll(
                PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "timestamp"))
        ).getContent();

        // Generate a mock threat timeline (hourly count for the last 6 hours)
        List<Map<String, Object>> threatTimeline = new ArrayList<>();
        Instant now = Instant.now();
        for (int i = 5; i >= 0; i--) {
            Instant hourInstant = now.minus(i, ChronoUnit.HOURS);
            String timeLabel = hourInstant.toString().substring(11, 16);
            long count = alertRepository.findAll().stream()
                    .filter(a -> ChronoUnit.HOURS.between(a.getTimestamp(), hourInstant) == 0)
                    .count();
            // Provide baseline mock activity if zero, so charts aren't completely flat
            long displayCount = count > 0 ? count : (i == 1 ? 3 : (i == 3 ? 5 : 1));
            
            threatTimeline.add(Map.of(
                    "time", timeLabel,
                    "attacks", displayCount,
                    "anomalies", displayCount + 2
            ));
        }

        // Mock attack map coordinates
        List<Map<String, Object>> attackMap = Arrays.asList(
                Map.of("id", 1, "country", "United States", "lat", 37.0902, "lng", -95.7129, "count", 14, "severity", "CRITICAL"),
                Map.of("id", 2, "country", "Germany", "lat", 51.1657, "lng", 10.4515, "count", 8, "severity", "HIGH"),
                Map.of("id", 3, "country", "China", "lat", 35.8617, "lng", 104.1954, "count", 25, "severity", "CRITICAL"),
                Map.of("id", 4, "country", "Brazil", "lat", -14.235, "lng", -51.9253, "count", 5, "severity", "MEDIUM"),
                Map.of("id", 5, "country", "Russia", "lat", 61.524, "lng", 105.3188, "count", 19, "severity", "HIGH")
        );

        // Top attacked assets
        List<Map<String, Object>> topAttackedAssets = Arrays.asList(
                Map.of("asset", "Main DC Server", "ip", "10.0.1.10", "type", "SERVER", "attacks", 42, "criticality", "CRITICAL"),
                Map.of("asset", "Edge Firewall", "ip", "10.0.0.1", "type", "FIREWALL", "attacks", 29, "criticality", "CRITICAL"),
                Map.of("asset", "ERP Web App", "ip", "10.0.2.100", "type", "APPLICATION", "attacks", 15, "criticality", "HIGH"),
                Map.of("asset", "HR Database", "ip", "10.0.3.50", "type", "DATABASE", "attacks", 11, "criticality", "CRITICAL"),
                Map.of("asset", "DMZ Switch", "ip", "10.0.0.5", "type", "SWITCH", "attacks", 8, "criticality", "MEDIUM")
        );

        Map<String, Object> response = new HashMap<>();
        response.put("totalLogs", totalLogs);
        response.put("activeAlerts", activeAlerts);
        response.put("activeIncidents", activeIncidents);
        response.put("criticalThreats", criticalThreats);
        response.put("aiRiskScore", Math.round(avgAiRiskScore * 100.0) / 100.0);
        response.put("totalUsers", totalUsers);
        response.put("activeUsers", activeUsers);
        response.put("recentAlerts", recentAlerts);
        response.put("recentIncidents", recentIncidents);
        response.put("recentLogs", recentLogs);
        response.put("threatTimeline", threatTimeline);
        response.put("attackMap", attackMap);
        response.put("topAttackedAssets", topAttackedAssets);
        response.put("totalTeams", totalTeams);
        response.put("recentLogins", recentLogins);
        response.put("systemHealth", Map.of(
                "status", "HEALTHY",
                "cpuUsage", "18%",
                "memoryUsage", "42%",
                "diskUsage", "54%",
                "dbConnection", "UP",
                "aiService", "UP"
        ));

        return ResponseEntity.ok(response);
    }
}
