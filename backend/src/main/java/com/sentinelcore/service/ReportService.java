package com.sentinelcore.service;

import com.sentinelcore.model.ReportRecord;
import com.sentinelcore.repository.ReportRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

@Service
public class ReportService {

    @Autowired
    private ReportRecordRepository reportRecordRepository;

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private AuditLogService auditLogService;

    public List<ReportRecord> getReports() {
        return reportRecordRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public ReportRecord generateReport(Map<String, Object> request, String currentUserEmail) {
        String type = (String) request.getOrDefault("type", "UNKNOWN");
        String format = (String) request.getOrDefault("format", "PDF");
        Boolean scheduled = (Boolean) request.getOrDefault("scheduled", false);
        String frequency = (String) request.getOrDefault("frequency", "");

        // Mock report title generation based on type
        String title = type.replace("_", " ") + " - " + LocalDateTime.now().toLocalDate().toString();
        
        // Mock generating random size for realism
        Random random = new Random();
        int sizeKB = 150 + random.nextInt(2000);
        String size = sizeKB > 1024 ? String.format("%.1f MB", sizeKB / 1024.0) : sizeKB + " KB";

        Map<String, Object> metrics = new HashMap<>();
        try {
            Map<String, Object> dashStats = dashboardService.getDashboardStats(null);
            
            if ("EXECUTIVE_SUMMARY".equals(type)) {
                metrics.put("Org Risk Score", dashStats.get("orgRiskScore"));
                metrics.put("Total Incidents", dashStats.get("totalIncidents"));
                metrics.put("Avg MTTR (Hours)", dashStats.get("avgMttrHours"));
                metrics.put("Compliance Score", dashStats.get("complianceScore"));
            } else if ("INCIDENT_SUMMARY".equals(type)) {
                metrics.put("Total Incidents", dashStats.get("totalIncidents"));
                metrics.put("Open Incidents", dashStats.get("openIncidents"));
                metrics.put("Avg MTTR (Hours)", dashStats.get("avgMttrHours"));
                metrics.put("My Assigned Incidents", dashStats.get("myAssignedIncidentCount"));
            } else if ("VULNERABILITY_REPORT".equals(type)) {
                metrics.put("Total Vulnerabilities", dashStats.get("totalVulnerabilities"));
                metrics.put("Open Vulnerabilities", dashStats.get("openVulnerabilities"));
                metrics.put("Critical Assets at Risk", dashStats.get("criticalAssetsAtRisk"));
            } else if ("COMPLIANCE_AUDIT".equals(type)) {
                metrics.put("Overall Compliance Score", dashStats.get("complianceScore"));
                metrics.put("Total Open Gaps", dashStats.get("complianceOpenGaps"));
            } else if ("THREAT_INTEL".equals(type)) {
                metrics.put("Total Threat Indicators", dashStats.get("totalThreatIntel"));
                metrics.put("Anomaly Logs Detected", dashStats.get("anomalyLogs"));
            } else if ("USER_ACTIVITY".equals(type)) {
                metrics.put("Total Users", dashStats.get("totalUsers"));
                metrics.put("Active Users", dashStats.get("activeUsers"));
                metrics.put("Total Teams", dashStats.get("totalTeams"));
                metrics.put("Total Log Entries", dashStats.get("totalLogs"));
            }
            
            // Apply requested filters to metrics as text notes
            if (StringUtils.hasText((String) request.get("severityFilter")) && !"ALL".equals(request.get("severityFilter"))) {
                metrics.put("Applied Severity Filter", request.get("severityFilter"));
            }
        } catch (Exception e) {
            metrics.put("Notice", "Unable to fetch live metrics at this time.");
        }

        ReportRecord record = ReportRecord.builder()
                .type(type)
                .title(title)
                .generatedBy(currentUserEmail)
                .format(format)
                .size(scheduled ? "Pending" : size)
                .dateFrom((String) request.get("dateFrom"))
                .dateTo((String) request.get("dateTo"))
                .severityFilter((String) request.get("severityFilter"))
                .teamFilter((String) request.get("teamFilter"))
                .assetFilter((String) request.get("assetFilter"))
                .scheduled(scheduled)
                .frequency(frequency)
                .metrics(metrics)
                .createdAt(LocalDateTime.now())
                .build();

        ReportRecord saved = reportRecordRepository.save(record);

        auditLogService.log(null, currentUserEmail, "REPORT_GENERATED", "REPORTS", 
                "Generated " + format + " report: " + title);

        return saved;
    }
}
