package com.sentinelcore.controller;

import com.sentinelcore.model.Alert;
import com.sentinelcore.model.Incident;
import com.sentinelcore.repository.AlertRepository;
import com.sentinelcore.repository.IncidentRepository;
import com.sentinelcore.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private AuditLogService auditLogService;

    private final Random random = new Random();

    @GetMapping
    public ResponseEntity<?> getAllIncidents(@RequestParam(required = false) String status,
                                             @RequestParam(required = false) String analystEmail) {
        List<Incident> incidents = incidentRepository.findAll();
        // Sort descending by creation date
        incidents.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        if (status != null && !status.trim().isEmpty()) {
            incidents.removeIf(i -> !i.getStatus().equalsIgnoreCase(status));
        }
        if (analystEmail != null && !analystEmail.trim().isEmpty()) {
            incidents.removeIf(i -> i.getAnalystEmail() == null || !i.getAnalystEmail().equalsIgnoreCase(analystEmail));
        }

        return ResponseEntity.ok(incidents);
    }

    @PostMapping
    public ResponseEntity<?> escalateAlert(@RequestBody Map<String, String> body,
                                           @AuthenticationPrincipal com.sentinelcore.model.User principal) {
        String userEmail = principal != null ? principal.getEmail() : "anonymous@sentinelcore.in";
        String alertIdStr = body.get("alertId");
        String title = body.get("title");
        String description = body.get("description");

        if (title == null || title.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Title is required"));
        }

        double riskScore = 0.5;
        String severity = "MEDIUM";

        // If alertId is provided, we can fetch its risk and severity
        if (alertIdStr != null && !alertIdStr.trim().isEmpty()) {
            Optional<Alert> alertOpt = alertRepository.findById(alertIdStr);
            if (alertOpt.isPresent()) {
                Alert alert = alertOpt.get();
                riskScore = alert.getRiskScore();
                severity = alert.getSeverity();
                if (description == null || description.trim().isEmpty()) {
                    description = alert.getDescription();
                }
                // Mark alert status as INVESTIGATING
                alert.setStatus("INVESTIGATING");
                alertRepository.save(alert);
            }
        }

        Incident incident = new Incident();
        incident.setIncidentId("INC-" + (10000 + random.nextInt(90000)));
        incident.setTitle(title);
        incident.setDescription(description);
        incident.setSeverity(severity);
        incident.setStatus("NEW");
        incident.setRiskScore(riskScore);
        incident.setCreatedAt(Instant.now());
        incident.setUpdatedAt(Instant.now());

        if (body.containsKey("analystEmail") && body.get("analystEmail") != null && !body.get("analystEmail").trim().isEmpty()) {
            incident.setAnalystEmail(body.get("analystEmail"));
            incident.setStatus("ASSIGNED");
        }

        Incident saved = incidentRepository.save(incident);

        auditLogService.log(
                userEmail,
                "INCIDENT_CREATE",
                "INCIDENTS",
                "127.0.0.1",
                "Escalated alert to Incident: " + incident.getIncidentId() + " (" + incident.getTitle() + ")"
        );

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateIncident(@PathVariable String id,
                                            @RequestBody Map<String, String> body,
                                            @AuthenticationPrincipal com.sentinelcore.model.User principal) {
        String userEmail = principal != null ? principal.getEmail() : "anonymous@sentinelcore.in";
        Optional<Incident> incidentOpt = incidentRepository.findById(id);
        if (incidentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Incident incident = incidentOpt.get();
        boolean changed = false;

        if (body.containsKey("status")) {
            String newStatus = body.get("status").toUpperCase();
            auditLogService.log(userEmail, "INCIDENT_STATUS_CHANGE", "INCIDENTS", "127.0.0.1",
                    "Incident " + incident.getIncidentId() + " status changed from " + incident.getStatus() + " to " + newStatus);
            incident.setStatus(newStatus);
            changed = true;
        }

        if (body.containsKey("analystEmail")) {
            String newAnalyst = body.get("analystEmail");
            auditLogService.log(userEmail, "INCIDENT_ASSIGN", "INCIDENTS", "127.0.0.1",
                    "Incident " + incident.getIncidentId() + " assigned to " + newAnalyst);
            incident.setAnalystEmail(newAnalyst);
            if ("NEW".equals(incident.getStatus()) && newAnalyst != null && !newAnalyst.trim().isEmpty()) {
                incident.setStatus("ASSIGNED");
            }
            changed = true;
        }

        if (body.containsKey("resolutionNotes")) {
            incident.setResolutionNotes(body.get("resolutionNotes"));
            changed = true;
        }

        if (changed) {
            incident.setUpdatedAt(Instant.now());
            incident = incidentRepository.save(incident);
        }

        return ResponseEntity.ok(incident);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIncident(@PathVariable String id, @AuthenticationPrincipal com.sentinelcore.model.User principal) {
        String userEmail = principal != null ? principal.getEmail() : "anonymous@sentinelcore.in";
        Optional<Incident> incidentOpt = incidentRepository.findById(id);
        if (incidentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        incidentRepository.deleteById(id);
        auditLogService.log(
                userEmail,
                "INCIDENT_DELETE",
                "INCIDENTS",
                "127.0.0.1",
                "Deleted Incident " + incidentOpt.get().getIncidentId()
        );

        return ResponseEntity.ok().build();
    }
}
