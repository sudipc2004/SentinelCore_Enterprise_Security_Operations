package com.sentinelcore.controller;

import com.sentinelcore.security.UserPrincipal;
import com.sentinelcore.service.SecurityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/logs")
public class SecurityLogController {

    @Autowired
    private SecurityLogService securityLogService;

    @GetMapping
    public ResponseEntity<?> getLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String systemType,
            @RequestParam(required = false) Boolean isAnomaly,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(securityLogService.getLogs(search, systemType, isAnomaly, startDate, endDate));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadLogs(
            @RequestParam("file") MultipartFile file,
            @RequestParam String systemType,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        int uploaded = securityLogService.uploadLogs(file, systemType, userPrincipal.getUsername());
        return ResponseEntity.ok(Map.of("message", "Ingested " + uploaded + " log records."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLog(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        securityLogService.deleteLog(id, userPrincipal.getUsername());
        return ResponseEntity.ok("Log deleted successfully.");
    }
}
