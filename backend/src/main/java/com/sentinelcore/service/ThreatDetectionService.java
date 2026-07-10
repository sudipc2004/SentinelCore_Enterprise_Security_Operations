package com.sentinelcore.service;

import com.sentinelcore.model.Alert;
import com.sentinelcore.model.Log;
import com.sentinelcore.repository.AlertRepository;
import com.sentinelcore.repository.LogRepository;
import com.sentinelcore.repository.ThreatIntelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.regex.Pattern;

@Service
public class ThreatDetectionService {

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private ThreatIntelRepository threatIntelRepository;

    @Autowired
    private AiAnomalyService aiAnomalyService;

    @Autowired
    private NotificationService notificationService;

    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
            "(?i)(union\\s+select|select.*from|'\\s*or\\s*'1'\\s*=\\s*'1|insert\\s+into|drop\\s+table|delete\\s+from)"
    );

    private final Random random = new Random();

    public Log processLog(Log log) {
        if (log.getTimestamp() == null) {
            log.setTimestamp(Instant.now());
        }

        // 1. Run AI Anomaly Service to obtain predictions
        Map<String, Object> aiResult = aiAnomalyService.predict(log);
        log.setAnomaly((Boolean) aiResult.getOrDefault("isAnomaly", false));
        log.setConfidenceScore(((Number) aiResult.getOrDefault("confidenceScore", 0.0)).doubleValue());
        log.setRiskScore(((Number) aiResult.getOrDefault("riskScore", 0.0)).doubleValue());

        // Save log to database first to get an ID
        Log savedLog = logRepository.save(log);

        // 2. Perform Rule Engine Evaluation
        boolean ruleTriggered = false;
        String alertSeverity = "LOW";
        String alertDescription = "";
        double ruleRiskScore = 0.0;

        String rawMsg = log.getRawMessage() != null ? log.getRawMessage() : "";
        int failedLoginCount = log.getFailedLoginCount() != null ? log.getFailedLoginCount() : 0;
        int reqFreq = log.getRequestFrequency() != null ? log.getRequestFrequency() : 0;

        // Check Threat Intel IOC Database
        if (log.getIpAddress() != null && threatIntelRepository.existsByValue(log.getIpAddress())) {
            ruleTriggered = true;
            alertSeverity = "CRITICAL";
            alertDescription = "Traffic detected from malicious IP address: " + log.getIpAddress() + " matching known Indicators of Compromise (IOC).";
            ruleRiskScore = 0.95;
        }
        // Rule: 5 Failed Logins -> High Alert
        else if (failedLoginCount >= 5) {
            ruleTriggered = true;
            alertSeverity = "HIGH";
            alertDescription = "Brute force attempt detected: " + failedLoginCount + " failed login attempts for user " + log.getUserEmail();
            ruleRiskScore = 0.85;
        }
        // Rule: Malware Signature -> Critical Alert
        else if (rawMsg.toLowerCase().contains("malware") || rawMsg.toLowerCase().contains("trojan") || rawMsg.toLowerCase().contains("ransomware") || rawMsg.toLowerCase().contains("backdoor")) {
            ruleTriggered = true;
            alertSeverity = "CRITICAL";
            alertDescription = "Malware activity signature detected: " + rawMsg;
            ruleRiskScore = 0.98;
        }
        // Rule: SQL Injection Pattern -> Medium Alert
        else if (SQL_INJECTION_PATTERN.matcher(rawMsg).find()) {
            ruleTriggered = true;
            alertSeverity = "MEDIUM";
            alertDescription = "SQL Injection attempt detected in payload: " + rawMsg;
            ruleRiskScore = 0.60;
        }
        // Rule: Port Scan -> High Alert
        else if (rawMsg.toLowerCase().contains("port scan") || reqFreq > 150) {
            ruleTriggered = true;
            alertSeverity = "HIGH";
            alertDescription = "Network Port Scan / DDoS attempt: high request frequency of " + reqFreq + " requests/sec from IP " + log.getIpAddress();
            ruleRiskScore = 0.75;
        }
        // Rule: AI Outlier anomaly -> Escalate based on risk score
        else if (log.isAnomaly() && log.getRiskScore() >= 0.5) {
            ruleTriggered = true;
            ruleRiskScore = log.getRiskScore();
            if (ruleRiskScore >= 0.8) {
                alertSeverity = "CRITICAL";
            } else if (ruleRiskScore >= 0.6) {
                alertSeverity = "HIGH";
            } else {
                alertSeverity = "MEDIUM";
            }
            alertDescription = "AI model detected behavioral anomaly. Outlier detected with confidence " + String.format("%.2f", log.getConfidenceScore() * 100) + "%";
        }

        // If rule or threat intel triggered, raise an alert!
        if (ruleTriggered) {
            Alert alert = new Alert();
            alert.setAlertId("ALT-" + (10000 + random.nextInt(90000)));
            alert.setSeverity(alertSeverity);
            alert.setStatus("NEW");
            alert.setRiskScore(ruleRiskScore);
            alert.setSourceIP(log.getIpAddress());
            alert.setDestinationIP(log.getPort() != null ? "Internal Port: " + log.getPort() : "Internal Node");
            alert.setUserEmail(log.getUserEmail());
            alert.setDescription(alertDescription);
            alert.setTimestamp(Instant.now());
            alert.setLogId(savedLog.getId());

            alertRepository.save(alert);

            // Broadcast real-time websocket and trigger notification audit trail
            notificationService.sendAlert(alert);
        }

        return savedLog;
    }
}
