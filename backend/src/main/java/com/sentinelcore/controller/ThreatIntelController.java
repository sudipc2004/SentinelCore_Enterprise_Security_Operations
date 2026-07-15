package com.sentinelcore.controller;

import com.sentinelcore.model.ThreatIntel;
import com.sentinelcore.security.UserPrincipal;
import com.sentinelcore.service.ThreatIntelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/threat-intel")
public class ThreatIntelController {

    @Autowired
    private ThreatIntelService threatIntelService;

    @GetMapping
    public ResponseEntity<?> getIocs() {
        return ResponseEntity.ok(threatIntelService.getIocs());
    }

    @PostMapping
    public ResponseEntity<ThreatIntel> createIoc(
            @RequestBody ThreatIntel request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(threatIntelService.createIoc(request, userPrincipal.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIoc(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        threatIntelService.deleteIoc(id, userPrincipal.getUsername());
        return ResponseEntity.ok("IOC deleted successfully.");
    }
}
