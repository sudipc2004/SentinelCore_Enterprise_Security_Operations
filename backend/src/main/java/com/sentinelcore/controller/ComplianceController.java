package com.sentinelcore.controller;

import com.sentinelcore.model.ComplianceFramework;
import com.sentinelcore.security.UserPrincipal;
import com.sentinelcore.service.ComplianceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compliance")
public class ComplianceController {

    @Autowired
    private ComplianceService complianceService;

    @GetMapping
    public ResponseEntity<List<ComplianceFramework>> getFrameworks() {
        return ResponseEntity.ok(complianceService.getFrameworks());
    }

    @GetMapping("/{frameworkId}")
    public ResponseEntity<ComplianceFramework> getFramework(@PathVariable String frameworkId) {
        return ResponseEntity.ok(complianceService.getFramework(frameworkId));
    }

    @PutMapping("/{frameworkId}/domains/{domainId}")
    public ResponseEntity<ComplianceFramework> updateDomain(
            @PathVariable String frameworkId,
            @PathVariable String domainId,
            @RequestBody Map<String, Integer> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(complianceService.updateDomain(frameworkId, domainId, request, userPrincipal.getUsername()));
    }

    @PostMapping("/{frameworkId}/domains/{domainId}/evidence")
    public ResponseEntity<?> addEvidence(
            @PathVariable String frameworkId,
            @PathVariable String domainId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(complianceService.addEvidence(frameworkId, domainId, request, userPrincipal.getUsername()));
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {
        return ResponseEntity.ok(Map.of(
                "openGaps", complianceService.getOpenGapCount(),
                "overallScore", complianceService.getOverallScore()
        ));
    }
}
