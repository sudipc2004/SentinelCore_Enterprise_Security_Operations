package com.sentinelcore.controller;

import com.sentinelcore.model.AuditLog;
import com.sentinelcore.model.Role;
import com.sentinelcore.security.UserPrincipal;
import com.sentinelcore.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Role role = userPrincipal.getUser().getRole();
        if (role == Role.ADMIN) {
            return ResponseEntity.ok(auditLogService.getAllLogs(pageable));
        } else if (role == Role.ANALYST) {
            return ResponseEntity.ok(auditLogService.getUserLogs(userPrincipal.getUser().getId(), pageable));
        } else {
            return ResponseEntity.status(403).build();
        }
    }
}
