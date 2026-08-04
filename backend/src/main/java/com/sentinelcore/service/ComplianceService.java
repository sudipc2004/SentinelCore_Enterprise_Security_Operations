package com.sentinelcore.service;

import com.sentinelcore.exception.BadRequestException;
import com.sentinelcore.exception.ResourceNotFoundException;
import com.sentinelcore.model.ComplianceFramework;
import com.sentinelcore.repository.ComplianceFrameworkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ComplianceService {

    @Autowired
    private ComplianceFrameworkRepository complianceFrameworkRepository;

    @Autowired
    private AuditLogService auditLogService;

    public List<ComplianceFramework> getFrameworks() {
        seedDefaultsIfEmpty();
        return complianceFrameworkRepository.findAll(Sort.by(Sort.Direction.ASC, "frameworkId"));
    }

    public ComplianceFramework getFramework(String frameworkId) {
        seedDefaultsIfEmpty();
        return complianceFrameworkRepository.findByFrameworkId(frameworkId)
                .orElseThrow(() -> new ResourceNotFoundException("Compliance framework not found: " + frameworkId));
    }

    public ComplianceFramework updateDomain(String frameworkId, String domainId, Map<String, Integer> request, String currentUserEmail) {
        ComplianceFramework framework = getFramework(frameworkId);
        ComplianceFramework.ComplianceDomain domain = findDomain(framework, domainId);

        domain.setControls(valueOrCurrent(request.get("controls"), domain.getControls()));
        domain.setCompliant(valueOrCurrent(request.get("compliant"), domain.getCompliant()));
        domain.setInReview(valueOrCurrent(request.get("inReview"), domain.getInReview()));
        domain.setOpen(valueOrCurrent(request.get("open"), domain.getOpen()));
        validateDomainCounts(domain);

        framework.setUpdatedAt(LocalDateTime.now());
        ComplianceFramework saved = complianceFrameworkRepository.save(framework);
        auditLogService.log(null, currentUserEmail, "COMPLIANCE_DOMAIN_UPDATED", "COMPLIANCE",
                "Updated compliance domain " + domainId + " in " + frameworkId);
        return saved;
    }

    public ComplianceFramework.ComplianceEvidence addEvidence(String frameworkId, String domainId, Map<String, String> request, String currentUserEmail) {
        if (!StringUtils.hasText(request.get("fileName"))) {
            throw new BadRequestException("Evidence fileName is required.");
        }

        ComplianceFramework framework = getFramework(frameworkId);
        ComplianceFramework.ComplianceDomain domain = findDomain(framework, domainId);
        if (domain.getEvidence() == null) {
            domain.setEvidence(new ArrayList<>());
        }

        ComplianceFramework.ComplianceEvidence evidence = ComplianceFramework.ComplianceEvidence.builder()
                .id(UUID.randomUUID().toString())
                .fileName(request.get("fileName").trim())
                .note(request.get("note"))
                .uploadedBy(currentUserEmail)
                .uploadedAt(LocalDateTime.now())
                .build();
        domain.getEvidence().add(evidence);
        framework.setUpdatedAt(LocalDateTime.now());
        complianceFrameworkRepository.save(framework);

        auditLogService.log(null, currentUserEmail, "COMPLIANCE_EVIDENCE_ADDED", "COMPLIANCE",
                "Attached evidence to " + frameworkId + "/" + domainId + ": " + evidence.getFileName());
        return evidence;
    }

    public int getOpenGapCount() {
        seedDefaultsIfEmpty();
        return complianceFrameworkRepository.findAll().stream()
                .flatMap(framework -> framework.getDomains().stream())
                .mapToInt(ComplianceFramework.ComplianceDomain::getOpen)
                .sum();
    }

    public int getOverallScore() {
        seedDefaultsIfEmpty();
        int total = complianceFrameworkRepository.findAll().stream()
                .flatMap(framework -> framework.getDomains().stream())
                .mapToInt(ComplianceFramework.ComplianceDomain::getControls)
                .sum();
        int compliant = complianceFrameworkRepository.findAll().stream()
                .flatMap(framework -> framework.getDomains().stream())
                .mapToInt(ComplianceFramework.ComplianceDomain::getCompliant)
                .sum();
        return total == 0 ? 100 : (int) Math.round((compliant * 100.0) / total);
    }

    private ComplianceFramework.ComplianceDomain findDomain(ComplianceFramework framework, String domainId) {
        return framework.getDomains().stream()
                .filter(domain -> domain.getId().equalsIgnoreCase(domainId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Compliance domain not found: " + domainId));
    }

    private int valueOrCurrent(Integer value, int current) {
        return value == null ? current : Math.max(value, 0);
    }

    private void validateDomainCounts(ComplianceFramework.ComplianceDomain domain) {
        if (domain.getCompliant() + domain.getInReview() + domain.getOpen() > domain.getControls()) {
            throw new BadRequestException("Compliant, in-review, and open counts cannot exceed total controls.");
        }
    }

    private void seedDefaultsIfEmpty() {
        if (complianceFrameworkRepository.count() > 0) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        complianceFrameworkRepository.saveAll(List.of(
                framework("SOC2", "SOC 2 Type II", "border-sky-500/30 bg-sky-500/10 text-sky-300",
                        "AICPA trust service criteria for security, availability, processing integrity, confidentiality, and privacy.",
                        List.of(
                                domain("CC1", "Control Environment", "Layers", 8, 6, 1, 1),
                                domain("CC2", "Communication & Info", "Globe", 6, 5, 1, 0),
                                domain("CC3", "Risk Assessment", "AlertTriangle", 7, 4, 2, 1),
                                domain("CC4", "Monitoring Activities", "BarChart2", 5, 4, 0, 1),
                                domain("CC5", "Logical Access Controls", "Lock", 10, 8, 1, 1),
                                domain("CC6", "System Operations", "Server", 9, 7, 1, 1),
                                domain("CC7", "Change Management", "RefreshCw", 6, 5, 0, 1),
                                domain("CC8", "Risk Mitigation", "ShieldCheck", 5, 3, 1, 1)
                        ), now),
                framework("ISO27001", "ISO/IEC 27001:2022", "border-purple-500/30 bg-purple-500/10 text-purple-300",
                        "International standard for information security management systems.",
                        List.of(
                                domain("A5", "Organizational Controls", "Layers", 37, 28, 5, 4),
                                domain("A6", "People Controls", "Users", 8, 6, 1, 1),
                                domain("A7", "Physical Controls", "Lock", 14, 11, 2, 1),
                                domain("A8", "Technological Controls", "Server", 34, 22, 7, 5)
                        ), now),
                framework("NIST", "NIST CSF 2.0", "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                        "NIST Cybersecurity Framework: Govern, Identify, Protect, Detect, Respond, Recover.",
                        List.of(
                                domain("GV", "Govern", "ShieldCheck", 6, 4, 1, 1),
                                domain("ID", "Identify", "AlertTriangle", 5, 3, 1, 1),
                                domain("PR", "Protect", "Lock", 6, 5, 0, 1),
                                domain("DE", "Detect", "BarChart2", 3, 2, 1, 0),
                                domain("RS", "Respond", "RefreshCw", 5, 3, 1, 1),
                                domain("RC", "Recover", "ShieldCheck", 3, 2, 0, 1)
                        ), now)
        ));
    }

    private ComplianceFramework framework(String id, String label, String badge, String description,
                                          List<ComplianceFramework.ComplianceDomain> domains, LocalDateTime now) {
        return ComplianceFramework.builder()
                .frameworkId(id)
                .label(label)
                .badge(badge)
                .description(description)
                .domains(new ArrayList<>(domains))
                .createdAt(now)
                .updatedAt(now)
                .build();
    }

    private ComplianceFramework.ComplianceDomain domain(String id, String name, String icon, int controls, int compliant, int inReview, int open) {
        return ComplianceFramework.ComplianceDomain.builder()
                .id(id)
                .name(name)
                .icon(icon)
                .controls(controls)
                .compliant(compliant)
                .inReview(inReview)
                .open(open)
                .evidence(new ArrayList<>())
                .build();
    }
}
