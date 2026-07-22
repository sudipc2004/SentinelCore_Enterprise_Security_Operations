package com.sentinelcore.controller;

import com.sentinelcore.dto.IncidentResponse;
import com.sentinelcore.model.Alert;
import com.sentinelcore.security.UserPrincipal;
import com.sentinelcore.service.AlertService;
import com.sentinelcore.service.IncidentService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private AlertService alertService;
    
    @Autowired
    private IncidentService incidentService;

    @GetMapping
    public ResponseEntity<Page<Alert>> getAlerts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String severity,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        
        Page<Alert> alerts = alertService.getAlerts(status, severity, pageable);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Alert> getAlertById(@PathVariable String id) {
        return ResponseEntity.ok(alertService.getAlertById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Alert> updateAlertStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> payload) {
        
        String status = payload.get("status");
        if (status == null || status.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        return ResponseEntity.ok(alertService.updateAlertStatus(id, status));
    }

    @PostMapping("/{id}/incident")
    public ResponseEntity<IncidentResponse> createIncidentFromAlert(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String userEmail = userPrincipal != null ? userPrincipal.getUsername() : "system@sentinelcore.local";
        IncidentResponse incident = incidentService.createIncidentFromAlert(id, userEmail);
        return ResponseEntity.ok(incident);
    }
}
