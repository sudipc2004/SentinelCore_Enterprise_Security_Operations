package com.sentinelcore.controller;

import com.sentinelcore.dto.AlertResponse;
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
    public ResponseEntity<Page<AlertResponse>> getAlerts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String severity,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "200") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        
        Page<AlertResponse> alerts = alertService.getAlerts(search, status, severity, pageable)
                .map(AlertResponse::fromAlert);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertResponse> getAlertById(@PathVariable String id) {
        return ResponseEntity.ok(AlertResponse.fromAlert(alertService.getAlertById(id)));
    }

    @RequestMapping(value = "/{id}/status", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<AlertResponse> updateAlertStatus(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> payload,
            @RequestParam(required = false) String status) {
        
        String targetStatus = (payload != null && payload.get("status") != null) ? payload.get("status") : status;
        if (targetStatus == null || targetStatus.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        return ResponseEntity.ok(AlertResponse.fromAlert(alertService.updateAlertStatus(id, targetStatus)));
    }

    @RequestMapping(value = "/{id}/acknowledge", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<AlertResponse> acknowledgeAlert(@PathVariable String id) {
        return ResponseEntity.ok(AlertResponse.fromAlert(alertService.acknowledgeAlert(id)));
    }

    @RequestMapping(value = "/{id}/dismiss", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<AlertResponse> dismissAlert(@PathVariable String id) {
        return ResponseEntity.ok(AlertResponse.fromAlert(alertService.dismissAlert(id)));
    }

    @RequestMapping(value = "/{id}/resolve", method = {RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<AlertResponse> resolveAlert(@PathVariable String id) {
        return ResponseEntity.ok(AlertResponse.fromAlert(alertService.resolveAlert(id)));
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
