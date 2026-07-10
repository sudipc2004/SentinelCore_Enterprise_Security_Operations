package com.sentinelcore.service;

import com.sentinelcore.model.Log;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class AiAnomalyService {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String AI_SERVICE_URL = "http://localhost:5000/predict";

    public Map<String, Object> predict(Log log) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("timestamp", log.getTimestamp().toString());
        payload.put("ipAddress", log.getIpAddress() != null ? log.getIpAddress() : "");
        payload.put("protocol", log.getProtocol() != null ? log.getProtocol() : "TCP");
        payload.put("port", log.getPort() != null ? log.getPort() : 0);
        payload.put("bytes", log.getBytes() != null ? log.getBytes() : 0L);
        payload.put("failedLoginCount", log.getFailedLoginCount() != null ? log.getFailedLoginCount() : 0);
        payload.put("requestFrequency", log.getRequestFrequency() != null ? log.getRequestFrequency() : 0);
        payload.put("country", log.getCountry() != null ? log.getCountry() : "Unknown");
        payload.put("userEmail", log.getUserEmail() != null ? log.getUserEmail() : "unknown@sentinelcore.in");
        payload.put("device", log.getDevice() != null ? log.getDevice() : "unknown-device");

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(AI_SERVICE_URL, payload, Map.class);
            if (response != null) {
                return response;
            }
        } catch (Exception e) {
            System.err.println("Warning: AI Anomaly service is offline. Using local heuristics. Reason: " + e.getMessage());
        }

        // Heuristic fallback if Python service is down
        return calculateHeuristicAnomaly(log);
    }

    private Map<String, Object> calculateHeuristicAnomaly(Log log) {
        double riskScore = 0.0;
        int failedLogins = log.getFailedLoginCount() != null ? log.getFailedLoginCount() : 0;
        int reqFreq = log.getRequestFrequency() != null ? log.getRequestFrequency() : 0;
        long bytes = log.getBytes() != null ? log.getBytes() : 0L;
        String raw = log.getRawMessage() != null ? log.getRawMessage().toLowerCase() : "";

        // Heuristics
        if (failedLogins >= 5) {
            riskScore += 0.5;
        } else if (failedLogins > 0) {
            riskScore += 0.1 * failedLogins;
        }

        if (reqFreq > 100) {
            riskScore += 0.3;
        } else if (reqFreq > 50) {
            riskScore += 0.15;
        }

        if (bytes > 10 * 1024 * 1024) { // >10MB
            riskScore += 0.2;
        }

        if (raw.contains("select") && (raw.contains("union") || raw.contains("or '1'='1"))) {
            riskScore += 0.45;
        }
        if (raw.contains("port scan") || raw.contains("nmap")) {
            riskScore += 0.4;
        }
        if (raw.contains("malware") || raw.contains("trojan") || raw.contains("exploit")) {
            riskScore += 0.6;
        }

        riskScore = Math.min(1.0, riskScore);
        boolean isAnomaly = riskScore >= 0.5;
        double confidence = isAnomaly ? 0.75 + (riskScore * 0.2) : 0.9 - (riskScore * 0.3);

        Map<String, Object> result = new HashMap<>();
        result.put("isAnomaly", isAnomaly);
        result.put("confidenceScore", confidence);
        result.put("riskScore", riskScore);
        return result;
    }
}
