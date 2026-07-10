package com.sentinelcore.controller;

import com.sentinelcore.model.Report;
import com.sentinelcore.repository.AlertRepository;
import com.sentinelcore.repository.IncidentRepository;
import com.sentinelcore.repository.LogRepository;
import com.sentinelcore.repository.ReportRepository;
import com.sentinelcore.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<?> getAllReports() {
        List<Report> reports = reportRepository.findAll();
        reports.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return ResponseEntity.ok(reports);
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateReport(@RequestBody Map<String, String> body,
                                            @AuthenticationPrincipal com.sentinelcore.model.User principal) {
        String email = principal != null ? principal.getEmail() : "anonymous@sentinelcore.in";
        String type = body.get("type");
        if (type == null || type.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Report type is required"));
        }

        String typeUpper = type.toUpperCase();
        long logCount = logRepository.count();
        long anomalyCount = logRepository.countByIsAnomalyTrue();
        long alertCount = alertRepository.count();
        long activeAlerts = alertRepository.countByStatus("NEW") + alertRepository.countByStatus("INVESTIGATING");
        long incidentCount = incidentRepository.count();
        long activeIncidents = incidentRepository.countByStatus("NEW") + incidentRepository.countByStatus("ASSIGNED") + incidentRepository.countByStatus("INVESTIGATING");

        String title = typeUpper + " Security Operations Summary - " + Instant.now().toString().substring(0, 10);
        
        Report report = new Report();
        report.setTitle(title);
        report.setType(typeUpper);
        report.setGeneratedBy(email);
        report.setCreatedAt(Instant.now());
        
        // Mock download paths. In a real system, these would generate real files.
        // We will store stats in metadata or mock paths to return to the UI.
        report.setPdfPath("/api/reports/download/" + typeUpper + "_report_" + System.currentTimeMillis() + ".pdf");
        report.setCsvPath("/api/reports/download/" + typeUpper + "_report_" + System.currentTimeMillis() + ".csv");

        Report saved = reportRepository.save(report);

        auditLogService.log(
                email,
                "REPORT_GENERATE",
                "REPORTS",
                "127.0.0.1",
                "Generated " + typeUpper + " report: " + title + " (Logs: " + logCount + ", Anomalies: " + anomalyCount + ", Alerts: " + alertCount + ")"
        );

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<?> downloadReportFile(@PathVariable String filename) {
        // Return a dynamically formatted mock CSV for the report contents
        StringBuilder csv = new StringBuilder();
        csv.append("SentinelCore Security Operations Platform - Exported Report\n");
        csv.append("Filename,").append(filename).append("\n");
        csv.append("Generated Time,").append(Instant.now().toString()).append("\n\n");
        
        csv.append("Metric,Value\n");
        csv.append("Total Processed Logs,").append(logRepository.count()).append("\n");
        csv.append("AI Detected Anomalies,").append(logRepository.countByIsAnomalyTrue()).append("\n");
        csv.append("Total Security Alerts,").append(alertRepository.count()).append("\n");
        csv.append("Total Escalated Incidents,").append(incidentRepository.count()).append("\n");
        csv.append("Compliance Health Status,98.5%\n");

        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                .body(csv.toString());
    }
}
