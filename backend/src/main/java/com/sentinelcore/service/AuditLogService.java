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

    private static final int SUSPICIOUS_LOGIN_THRESHOLD = 5;
    private static final int SUSPICIOUS_LOGIN_WINDOW_MINUTES = 5;
    private static final int BRUTE_FORCE_THRESHOLD = 20;
    private static final int BRUTE_FORCE_WINDOW_MINUTES = 1;

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
            evaluateFailedLoginRules(userEmail, ipAddress);
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

    private void evaluateFailedLoginRules(String userEmail, String ipAddress) {
        LocalDateTime bruteForceWindow = LocalDateTime.now().minusMinutes(BRUTE_FORCE_WINDOW_MINUTES);
        long userBruteForceCount = auditLogRepository.countByUserEmailAndActionAndTimestampAfter(userEmail, "LOGIN_FAILED", bruteForceWindow);
        long ipBruteForceCount = auditLogRepository.countByIpAddressAndActionAndTimestampAfter(ipAddress, "LOGIN_FAILED", bruteForceWindow);

        if (Math.max(userBruteForceCount, ipBruteForceCount) >= BRUTE_FORCE_THRESHOLD) {
            long scopedCount = Math.max(userBruteForceCount, ipBruteForceCount);
            String title = "Brute Force Attack Detected: " + userEmail;
            String alertDescription = "Detected " + scopedCount + " failed login attempts tied to user " + userEmail
                    + " or source IP " + ipAddress + " in the last " + BRUTE_FORCE_WINDOW_MINUTES + " minute.";
            alertService.processAuditRule(
                    "AUTH_BRUTE_FORCE",
                    "Authentication",
                    title,
                    alertDescription,
                    "CRITICAL",
                    ipAddress,
                    (int) scopedCount
            );
            return;
        }

        LocalDateTime suspiciousLoginWindow = LocalDateTime.now().minusMinutes(SUSPICIOUS_LOGIN_WINDOW_MINUTES);
        long userFailedCount = auditLogRepository.countByUserEmailAndActionAndTimestampAfter(userEmail, "LOGIN_FAILED", suspiciousLoginWindow);
        long sourceFailedCount = auditLogRepository.countByIpAddressAndActionAndTimestampAfter(ipAddress, "LOGIN_FAILED", suspiciousLoginWindow);
        long sameUserAndIpFailedCount = auditLogRepository.countByUserEmailAndIpAddressAndActionAndTimestampAfter(userEmail, ipAddress, "LOGIN_FAILED", suspiciousLoginWindow);

        if (Math.max(userFailedCount, Math.max(sourceFailedCount, sameUserAndIpFailedCount)) >= SUSPICIOUS_LOGIN_THRESHOLD) {
            long scopedCount = Math.max(userFailedCount, Math.max(sourceFailedCount, sameUserAndIpFailedCount));
            String title = "Suspicious Login Activity: " + userEmail;
            String alertDescription = "Detected " + scopedCount + " failed login attempts tied to user " + userEmail
                    + " or source IP " + ipAddress + " in the last " + SUSPICIOUS_LOGIN_WINDOW_MINUTES + " minutes.";
            alertService.processAuditRule(
                    "AUTH_SUSPICIOUS_LOGIN",
                    "Authentication",
                    title,
                    alertDescription,
                    "HIGH",
                    ipAddress,
                    (int) scopedCount
            );
        }
    }

    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public Page<AuditLog> getUserLogs(String userId, Pageable pageable) {
        return auditLogRepository.findByUserId(userId, pageable);
    }
}
