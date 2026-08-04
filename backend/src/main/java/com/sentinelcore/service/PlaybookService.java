package com.sentinelcore.service;

import com.sentinelcore.exception.BadRequestException;
import com.sentinelcore.exception.ResourceNotFoundException;
import com.sentinelcore.model.Playbook;
import com.sentinelcore.repository.PlaybookRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PlaybookService {

    @Autowired
    private PlaybookRepository playbookRepository;

    @Autowired
    private AuditLogService auditLogService;

    public List<Playbook> getPlaybooks() {
        seedDefaultsIfEmpty();
        return playbookRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public Playbook getPlaybook(String id) {
        seedDefaultsIfEmpty();
        return playbookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playbook not found: " + id));
    }

    public Playbook createPlaybook(Playbook playbook, String currentUserEmail) {
        if (!StringUtils.hasText(playbook.getName())) {
            throw new BadRequestException("Playbook name is required.");
        }
        playbook.setId(UUID.randomUUID().toString());
        playbook.setStatus(StringUtils.hasText(playbook.getStatus()) ? playbook.getStatus() : "DRAFT");
        playbook.setTriggerType(StringUtils.hasText(playbook.getLinkedAlertRuleId()) ? "ALERT_RULE" : "MANUAL");
        playbook.setCreatedAt(LocalDateTime.now());
        playbook.setUpdatedAt(LocalDateTime.now());

        if (playbook.getSteps() == null) {
            playbook.setSteps(new ArrayList<>());
        }

        Playbook saved = playbookRepository.save(playbook);
        auditLogService.log(null, currentUserEmail, "PLAYBOOK_CREATED", "AUTOMATION",
                "Created playbook: " + saved.getName());
        return saved;
    }

    public Playbook updatePlaybook(String id, Playbook request, String currentUserEmail) {
        Playbook existing = getPlaybook(id);

        if (StringUtils.hasText(request.getName())) existing.setName(request.getName().trim());
        if (request.getDescription() != null) existing.setDescription(request.getDescription().trim());
        if (request.getStatus() != null) existing.setStatus(request.getStatus());
        existing.setLinkedAlertRuleId(request.getLinkedAlertRuleId());
        existing.setTriggerType(StringUtils.hasText(request.getLinkedAlertRuleId()) ? "ALERT_RULE" : "MANUAL");

        if (request.getSteps() != null) {
            existing.setSteps(request.getSteps());
        }

        existing.setUpdatedAt(LocalDateTime.now());
        Playbook saved = playbookRepository.save(existing);

        auditLogService.log(null, currentUserEmail, "PLAYBOOK_UPDATED", "AUTOMATION",
                "Updated playbook: " + saved.getName());
        return saved;
    }

    public void deletePlaybook(String id, String currentUserEmail) {
        Playbook existing = getPlaybook(id);
        playbookRepository.delete(existing);
        auditLogService.log(null, currentUserEmail, "PLAYBOOK_DELETED", "AUTOMATION",
                "Deleted playbook: " + existing.getName());
    }

    public Map<String, Object> runSimulation(String id, String currentUserEmail) {
        Playbook playbook = getPlaybook(id);
        long startTime = System.currentTimeMillis();

        List<Map<String, Object>> executedSteps = new ArrayList<>();
        int stepIndex = 1;

        for (Playbook.PlaybookStep step : playbook.getSteps()) {
            long stepStart = System.currentTimeMillis();
            String logOutput = generateStepExecutionLog(step);
            long stepDuration = Math.max(80, (long) (Math.random() * 250) + 120);

            executedSteps.add(Map.of(
                    "stepIndex", stepIndex++,
                    "stepId", step.getId() != null ? step.getId() : UUID.randomUUID().toString(),
                    "title", step.getTitle() != null ? step.getTitle() : "Untitled Step",
                    "type", step.getType() != null ? step.getType() : "NOTIFY",
                    "status", "SUCCESS",
                    "logOutput", logOutput,
                    "durationMs", stepDuration
            ));
        }

        long totalTime = System.currentTimeMillis() - startTime + (executedSteps.size() * 150L);

        playbook.setLastRunAt(LocalDateTime.now());
        playbook.setLastRunStatus("SUCCESS");
        playbookRepository.save(playbook);

        auditLogService.log(null, currentUserEmail, "PLAYBOOK_SIMULATION_EXECUTED", "AUTOMATION",
                "Ran automation simulation for playbook: " + playbook.getName() + " (" + executedSteps.size() + " steps executed)");

        Map<String, Object> result = new HashMap<>();
        result.put("playbookId", playbook.getId());
        result.put("playbookName", playbook.getName());
        result.put("triggeredBy", currentUserEmail);
        result.put("status", "COMPLETED");
        result.put("totalSteps", executedSteps.size());
        result.put("executionTimeMs", totalTime);
        result.put("executedSteps", executedSteps);
        result.put("executedAt", LocalDateTime.now().toString());
        return result;
    }

    public List<Map<String, Object>> getAlertRules() {
        return List.of(
                Map.of("id", "ar-1", "name", "Brute Force Login", "condition", "Failed logins > 10 in 5 min from same IP", "severity", "CRITICAL"),
                Map.of("id", "ar-2", "name", "Outbound DNS Tunneling", "condition", "DNS query volume > 500/min to external", "severity", "HIGH"),
                Map.of("id", "ar-3", "name", "Lateral Movement", "condition", "Process spawn anomaly on workstation", "severity", "HIGH"),
                Map.of("id", "ar-4", "name", "Config File Modified", "condition", "Critical file write outside change window", "severity", "MEDIUM"),
                Map.of("id", "ar-5", "name", "Suspicious PowerShell", "condition", "Encoded PS1 execution on any endpoint", "severity", "HIGH"),
                Map.of("id", "ar-6", "name", "Internal Port Scan", "condition", "Internal host scanning 3+ /24 subnets", "severity", "MEDIUM"),
                Map.of("id", "ar-7", "name", "Admin Group Modification", "condition", "User added to privileged group", "severity", "CRITICAL"),
                Map.of("id", "ar-8", "name", "SSL Certificate Expiry", "condition", "TLS cert < 7 days to expiry", "severity", "LOW")
        );
    }

    private String generateStepExecutionLog(Playbook.PlaybookStep step) {
        String type = step.getType() == null ? "NOTIFY" : step.getType().toUpperCase();
        switch (type) {
            case "CONTAIN":
                return "[CONTAINMENT] EDR API triggered: Isolated host workstation endpoint and revoked active SSO sessions.";
            case "BLOCK":
                return "[FIREWALL_BLOCK] Inbound firewall API: Added malicious IP/Domain to perimeter block list.";
            case "INVESTIGATE":
                return "[FORENSIC_TRIAGE] Pulled last 100 system events, process trees, and network sockets for target asset.";
            case "NOTIFY":
                return "[NOTIFICATION] Dispatched real-time alert payload to #soc-alerts channel via Webhook.";
            case "TICKET":
                return "[INCIDENT_MGMT] Created P1 Incident ticket in SOC queue with automated forensic telemetry.";
            case "ESCALATE":
                return "[AUTO_ESCALATION] Escalated ticket priority to Security Lead and scheduled PagerDuty page.";
            case "REMEDIATE":
                return "[REMEDIATION] Restored target system configuration from last known-good gold image backup snapshot.";
            default:
                return "[AUTOMATION_STEP] Executed automated task: " + step.getTitle();
        }
    }

    private void seedDefaultsIfEmpty() {
        if (playbookRepository.count() > 0) return;

        LocalDateTime now = LocalDateTime.now();

        Playbook pb1 = Playbook.builder()
                .id("pb-1")
                .name("Brute Force Response")
                .description("Automated response for brute force login attempts — block source, alert team, open ticket.")
                .triggerType("ALERT_RULE")
                .linkedAlertRuleId("ar-1")
                .status("ACTIVE")
                .createdAt(now.minusDays(7))
                .updatedAt(now.minusDays(7))
                .steps(List.of(
                        new Playbook.PlaybookStep("s1", "INVESTIGATE", "Gather Login Context", "Pull last 100 auth events for source IP from log explorer.", "API: /api/logs?ip={sourceIp}"),
                        new Playbook.PlaybookStep("s2", "BLOCK", "Block Source IP", "Add source IP to firewall block-list via API.", "PaloAlto WAF API: POST /block"),
                        new Playbook.PlaybookStep("s3", "NOTIFY", "Notify SOC Team", "Send Slack alert to #soc-alerts with IP and event summary.", "Webhook: #soc-alerts"),
                        new Playbook.PlaybookStep("s4", "TICKET", "Open Incident Ticket", "Auto-create P1 incident with pre-filled context.", "Jira/SOAR API: /api/incidents"),
                        new Playbook.PlaybookStep("s5", "ESCALATE", "Escalate if Unresolved 2h", "If ticket not resolved in 2h, escalate to team lead.", "Auto-Escalation Rule #14")
                ))
                .build();

        Playbook pb2 = Playbook.builder()
                .id("pb-2")
                .name("Ransomware Containment")
                .description("Isolate infected endpoint, snapshot disk, notify IR team and preserve evidence.")
                .triggerType("MANUAL")
                .linkedAlertRuleId(null)
                .status("ACTIVE")
                .createdAt(now.minusDays(14))
                .updatedAt(now.minusDays(14))
                .steps(List.of(
                        new Playbook.PlaybookStep("s1", "INVESTIGATE", "Identify Affected Assets", "Check lateral movement logs and file modification events.", "LogExplorer Query: ransomware AND file_modification"),
                        new Playbook.PlaybookStep("s2", "CONTAIN", "Isolate Endpoint", "Trigger EDR isolation API for affected workstation.", "CrowdStrike/Defender API: /isolate"),
                        new Playbook.PlaybookStep("s3", "INVESTIGATE", "Snapshot Disk Image", "Initiate forensic disk snapshot for evidence preservation.", "AWS EBS Snapshot API"),
                        new Playbook.PlaybookStep("s4", "NOTIFY", "Notify IR Team", "Page on-call IR analyst via PagerDuty integration.", "PagerDuty Incident Trigger"),
                        new Playbook.PlaybookStep("s5", "REMEDIATE", "Restore from Clean Backup", "Restore endpoint from last known-good backup snapshot.", "Veeam Backup Restore API"),
                        new Playbook.PlaybookStep("s6", "TICKET", "Post-Incident Report", "Create follow-up ticket for PIR within 48h.", "Confluence PIR Template")
                ))
                .build();

        Playbook pb3 = Playbook.builder()
                .id("pb-3")
                .name("Phishing Email Triage")
                .description("Automated triage for reported phishing emails — extract IOCs, scan mailboxes, block sender.")
                .triggerType("ALERT_RULE")
                .linkedAlertRuleId("ar-7")
                .status("DRAFT")
                .createdAt(now.minusDays(3))
                .updatedAt(now.minusDays(3))
                .steps(List.of(
                        new Playbook.PlaybookStep("s1", "INVESTIGATE", "Extract Email IOCs", "Parse headers, links, and attachments for IOC indicators.", "O365 Mail Triage API"),
                        new Playbook.PlaybookStep("s2", "BLOCK", "Block Sender Domain", "Add sender domain to email gateway block-list.", "Proofpoint API: /block-domain"),
                        new Playbook.PlaybookStep("s3", "REMEDIATE", "Sweep All Mailboxes", "Search and delete matching emails across all mailboxes.", "Exchange PowerShell Purge"),
                        new Playbook.PlaybookStep("s4", "NOTIFY", "User Awareness Alert", "Send security awareness notice to all users in affected dept.", "Email Broadcast Engine")
                ))
                .build();

        playbookRepository.saveAll(List.of(pb1, pb2, pb3));
    }
}
