package com.sentinelcore.controller;

import com.sentinelcore.model.ThreatIntel;
import com.sentinelcore.repository.ThreatIntelRepository;
import com.sentinelcore.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/threat-intel")
public class ThreatIntelController {

    @Autowired
    private ThreatIntelRepository threatIntelRepository;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<?> getAllThreatIntel() {
        List<ThreatIntel> iocs = threatIntelRepository.findAll();
        // Sort descending by creation date
        iocs.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return ResponseEntity.ok(iocs);
    }

    @PostMapping
    public ResponseEntity<?> addThreatIntel(@RequestBody ThreatIntel ioc, @AuthenticationPrincipal com.sentinelcore.model.User principal) {
        String userEmail = principal != null ? principal.getEmail() : "anonymous@sentinelcore.in";
        ioc.setCreatedAt(Instant.now());
        ThreatIntel saved = threatIntelRepository.save(ioc);

        auditLogService.log(
                userEmail,
                "THREAT_INTEL_ADD",
                "THREAT_INTEL",
                "127.0.0.1",
                "Added Indicators of Compromise (IOC): " + saved.getType() + " = " + saved.getValue()
        );

        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteThreatIntel(@PathVariable String id, @AuthenticationPrincipal com.sentinelcore.model.User principal) {
        String userEmail = principal != null ? principal.getEmail() : "anonymous@sentinelcore.in";
        Optional<ThreatIntel> iocOpt = threatIntelRepository.findById(id);
        if (iocOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        threatIntelRepository.deleteById(id);
        auditLogService.log(
                userEmail,
                "THREAT_INTEL_DELETE",
                "THREAT_INTEL",
                "127.0.0.1",
                "Deleted Indicators of Compromise (IOC): " + iocOpt.get().getType() + " = " + iocOpt.get().getValue()
        );

        return ResponseEntity.ok().build();
    }
}
