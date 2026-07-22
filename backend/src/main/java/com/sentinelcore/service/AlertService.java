package com.sentinelcore.service;

import com.sentinelcore.exception.ResourceNotFoundException;
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
import java.util.List;

@Service
public class AlertService {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Lazy
    @Autowired
    private AuditLogService auditLogService;

    public void processLogs(List<SecurityLog> logs) {
        for (SecurityLog log : logs) {
            if (log.isAnomaly() || (log.getRiskScore() != null && log.getRiskScore() > 0.7)) {
                processAnomalousLog(log);
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
        
        Criteria activeStatus = Criteria.where("status").in("NEW", "INVESTIGATING");
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

    private String determineSeverity(Double riskScore) {
        if (riskScore == null) return "MEDIUM";
        if (riskScore >= 0.90) return "CRITICAL";
        if (riskScore >= 0.70) return "HIGH";
        if (riskScore >= 0.40) return "MEDIUM";
        return "LOW";
    }

    public Page<Alert> getAlerts(String status, String severity, Pageable pageable) {
        Query query = new Query();
        List<Criteria> criteria = new ArrayList<>();

        if (StringUtils.hasText(status)) {
            criteria.add(Criteria.where("status").is(status));
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
        alert.setStatus(status);
        alert.setUpdatedAt(LocalDateTime.now());
        Alert updatedAlert = alertRepository.save(alert);
        auditLogService.log("system", "system@sentinelcore.local", "ALERT_UPDATED", "ALERT_MANAGEMENT", "Alert status updated to " + status + " for alert: " + id);
        return updatedAlert;
    }

    public void processAuditAnomaly(String title, String description, String severity, String sourceIp) {
        // Deduplication for audit alerts
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        Query query = new Query();
        Criteria ipCriteria = Criteria.where("sourceIp").is(sourceIp);
        Criteria titleCriteria = Criteria.where("title").is(title);
        Criteria activeStatus = Criteria.where("status").in("NEW", "INVESTIGATING");
        Criteria recentTimestamp = Criteria.where("updatedAt").gte(oneHourAgo);
        
        query.addCriteria(new Criteria().andOperator(ipCriteria, titleCriteria, activeStatus, recentTimestamp));
        
        Alert existingAlert = mongoTemplate.findOne(query, Alert.class);
        
        if (existingAlert != null) {
            existingAlert.setUpdatedAt(LocalDateTime.now());
            // Escalate if needed (though for repeated failed logins it's already HIGH/CRITICAL)
            if ("HIGH".equals(severity) && !"CRITICAL".equals(existingAlert.getSeverity())) {
                existingAlert.setSeverity("CRITICAL");
            }
            alertRepository.save(existingAlert);
        } else {
            Alert newAlert = Alert.builder()
                    .title(title)
                    .description(description)
                    .severity(severity)
                    .status("NEW")
                    .sourceIp(sourceIp)
                    .timestamp(LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            alertRepository.save(newAlert);
            auditLogService.log("system", "system@sentinelcore.local", "ALERT_CREATED", "ALERT_MANAGEMENT", "Alert created: " + newAlert.getTitle());
        }
    }
}
