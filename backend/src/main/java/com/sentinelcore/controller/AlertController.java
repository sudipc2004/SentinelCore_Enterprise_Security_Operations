package com.sentinelcore.controller;

import com.sentinelcore.model.Alert;
import com.sentinelcore.repository.AlertRepository;
import com.sentinelcore.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<?> getAllAlerts(@RequestParam(required = false) String severity,
                                          @RequestParam(required = false) String status) {
        List<Alert> alerts = alertRepository.findAll();
        // Sort descending by timestamp
        alerts.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));

        if (severity != null && !severity.trim().isEmpty()) {
            alerts.removeIf(a -> !a.getSeverity().equalsIgnoreCase(severity));
        }
        if (status != null && !status.trim().isEmpty()) {
            alerts.removeIf(a -> !a.getStatus().equalsIgnoreCase(status));
        }

        return ResponseEntity.ok(alerts);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAlertStatus(@PathVariable String id,
                                               @RequestBody Map<String, String> body,
                                               @AuthenticationPrincipal com.sentinelcore.model.User principal) {
        String email = principal != null ? principal.getEmail() : "anonymous@sentinelcore.in";
        Optional<Alert> alertOpt = alertRepository.findById(id);
        if (alertOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Alert alert = alertOpt.get();
        String newStatus = body.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Status cannot be empty"));
        }

        String oldStatus = alert.getStatus();
        alert.setStatus(newStatus.toUpperCase());
        Alert saved = alertRepository.save(alert);

        auditLogService.log(
                email,
                "ALERT_UPDATE",
                "ALERTS",
                "127.0.0.1",
                "Updated alert " + alert.getAlertId() + " status from " + oldStatus + " to " + newStatus
        );

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAlert(@PathVariable String id, @AuthenticationPrincipal com.sentinelcore.model.User principal) {
        String email = principal != null ? principal.getEmail() : "anonymous@sentinelcore.in";
        Optional<Alert> alertOpt = alertRepository.findById(id);
        if (alertOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        alertRepository.deleteById(id);
        auditLogService.log(
                email,
                "ALERT_DELETE",
                "ALERTS",
                "127.0.0.1",
                "Deleted alert " + alertOpt.get().getAlertId()
        );

        return ResponseEntity.ok().build();
    }
}
