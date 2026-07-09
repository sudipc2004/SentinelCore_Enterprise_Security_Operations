package com.sentinelcore.service;

import com.sentinelcore.model.AuditLog;
import com.sentinelcore.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public void log(String email, String action, String module, String ipAddress, String description) {
        AuditLog log = new AuditLog();
        log.setUserEmail(email);
        log.setAction(action);
        log.setModule(module);
        log.setIpAddress(ipAddress != null ? ipAddress : "UNKNOWN");
        log.setDescription(description);
        log.setTimestamp(Instant.now());
        auditLogRepository.save(log);
    }
}
