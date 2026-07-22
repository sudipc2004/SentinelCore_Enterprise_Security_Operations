package com.sentinelcore.service;

import com.sentinelcore.model.AuditLog;
import com.sentinelcore.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private HttpServletRequest request;

    @Autowired
    private AlertService alertService;

    public void log(String userId, String userEmail, String action, String module, String description) {
        String ipAddress = request.getRemoteAddr();
        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .userEmail(userEmail)
                .action(action)
                .module(module)
                .description(description)
                .timestamp(LocalDateTime.now())
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(auditLog);

        if ("LOGIN_FAILED".equals(action)) {
            // Check for Brute Force (>= 20 in 1 minute)
            LocalDateTime oneMinAgo = LocalDateTime.now().minusMinutes(1);
            long bruteForceCount = auditLogRepository.countByUserEmailAndActionAndTimestampAfter(userEmail, "LOGIN_FAILED", oneMinAgo);
            if (bruteForceCount >= 20) {
                String title = "Brute Force Attack Detected: " + userEmail;
                String alertDescription = "Detected " + bruteForceCount + " failed login attempts for user " + userEmail + " from IP " + ipAddress + " in the last 1 minute.";
                alertService.processAuditAnomaly(title, alertDescription, "CRITICAL", ipAddress);
            } else {
                // Check for multiple failed logins (e.g. >= 5 in the last 5 minutes)
                LocalDateTime fiveMinsAgo = LocalDateTime.now().minusMinutes(5);
                long failedCount = auditLogRepository.countByUserEmailAndActionAndTimestampAfter(userEmail, "LOGIN_FAILED", fiveMinsAgo);
                if (failedCount >= 5) {
                    String title = "Suspicious Login Activity: " + userEmail;
                    String alertDescription = "Detected " + failedCount + " failed login attempts for user " + userEmail + " from IP " + ipAddress + " in the last 5 minutes.";
                    alertService.processAuditAnomaly(title, alertDescription, "HIGH", ipAddress);
                }
            }
        } else if ("LOGIN_SUCCESS".equals(action)) {
            // Check for Impossible Travel (same user logging in from different IPs within 10 minutes)
            LocalDateTime tenMinsAgo = LocalDateTime.now().minusMinutes(10);
            java.util.List<AuditLog> recentLogins = auditLogRepository.findByUserEmailAndActionAndTimestampAfter(userEmail, "LOGIN_SUCCESS", tenMinsAgo);
            for (AuditLog log : recentLogins) {
                if (log.getIpAddress() != null && !log.getIpAddress().equals(ipAddress)) {
                    String title = "Impossible Travel Detected: " + userEmail;
                    String alertDescription = "User " + userEmail + " successfully logged in from different locations (" + log.getIpAddress() + " and " + ipAddress + ") within 10 minutes.";
                    alertService.processAuditAnomaly(title, alertDescription, "HIGH", ipAddress);
                    break;
                }
            }
        }
    }

    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public Page<AuditLog> getUserLogs(String userId, Pageable pageable) {
        return auditLogRepository.findByUserId(userId, pageable);
    }
}
