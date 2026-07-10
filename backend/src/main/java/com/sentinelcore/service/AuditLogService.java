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
    }

    public Page<AuditLog> getAllLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }

    public Page<AuditLog> getUserLogs(String userId, Pageable pageable) {
        return auditLogRepository.findByUserId(userId, pageable);
    }
}
