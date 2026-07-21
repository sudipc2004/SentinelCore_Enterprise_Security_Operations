package com.sentinelcore.controller;

import com.sentinelcore.model.*;
import com.sentinelcore.security.UserPrincipal;
import com.sentinelcore.service.ThreatIntelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/threat-intel")
public class ThreatIntelController {

    @Autowired
    private ThreatIntelService threatIntelService;

    @GetMapping
    public ResponseEntity<?> getIocs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        // Return plain list if pagination parameters are not explicitly needed for compatibility
        if (search == null && type == null && size >= 100) {
            return ResponseEntity.ok(threatIntelService.getAllIocs());
        }
        
        Page<ThreatIOC> iocPage = threatIntelService.searchIocs(search, type, page, size);
        Map<String, Object> response = new HashMap<>();
        response.put("content", iocPage.getContent());
        response.put("totalPages", iocPage.getTotalPages());
        response.put("totalElements", iocPage.getTotalElements());
        response.put("number", iocPage.getNumber());
        response.put("size", iocPage.getSize());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ThreatIOC> getIocById(@PathVariable String id) {
        return ResponseEntity.ok(threatIntelService.getIocById(id));
    }

    @PostMapping
    public ResponseEntity<ThreatIOC> createIoc(
            @RequestBody ThreatIOC request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String email = userPrincipal != null ? userPrincipal.getUsername() : "admin@sentinelcore.in";
        return ResponseEntity.ok(threatIntelService.createIoc(request, email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ThreatIOC> updateIoc(
            @PathVariable String id,
            @RequestBody ThreatIOC request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String email = userPrincipal != null ? userPrincipal.getUsername() : "admin@sentinelcore.in";
        return ResponseEntity.ok(threatIntelService.updateIoc(id, request, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIoc(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String email = userPrincipal != null ? userPrincipal.getUsername() : "admin@sentinelcore.in";
        threatIntelService.deleteIoc(id, email);
        return ResponseEntity.ok(Map.of("message", "IOC deleted successfully."));
    }

    // --- Enrichment ---

    @GetMapping("/{id}/enrichment")
    public ResponseEntity<IOCEnrichment> getEnrichment(@PathVariable String id) {
        return ResponseEntity.ok(threatIntelService.getEnrichment(id));
    }

    @PostMapping("/{id}/enrich")
    public ResponseEntity<IOCEnrichment> enrichIoc(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String email = userPrincipal != null ? userPrincipal.getUsername() : "admin@sentinelcore.in";
        return ResponseEntity.ok(threatIntelService.enrichIoc(id, email));
    }

    // --- Feeds ---

    @GetMapping("/feeds")
    public ResponseEntity<List<ThreatFeed>> getFeeds() {
        return ResponseEntity.ok(threatIntelService.getFeeds());
    }

    @PostMapping("/feeds/{id}/toggle")
    public ResponseEntity<ThreatFeed> toggleFeed(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String email = userPrincipal != null ? userPrincipal.getUsername() : "admin@sentinelcore.in";
        return ResponseEntity.ok(threatIntelService.toggleFeed(id, email));
    }

    @PostMapping("/feeds/{id}/sync")
    public ResponseEntity<ThreatFeed> syncFeed(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String email = userPrincipal != null ? userPrincipal.getUsername() : "admin@sentinelcore.in";
        return ResponseEntity.ok(threatIntelService.syncFeed(id, email));
    }

    // --- Notes ---

    @GetMapping("/{id}/notes")
    public ResponseEntity<List<AnalystNote>> getNotes(@PathVariable String id) {
        return ResponseEntity.ok(threatIntelService.getNotes(id, "IOC"));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<AnalystNote> addNote(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String email = userPrincipal != null ? userPrincipal.getUsername() : "admin@sentinelcore.in";
        String name = userPrincipal != null ? userPrincipal.getUser().getName() : "Admin";
        String content = body.get("content");
        return ResponseEntity.ok(threatIntelService.addNote(id, "IOC", content, email, name));
    }

    // --- Import ---

    @PostMapping("/import")
    public ResponseEntity<List<ThreatIOC>> importIocs(
            @RequestBody List<ThreatIOC> iocs,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        String email = userPrincipal != null ? userPrincipal.getUsername() : "admin@sentinelcore.in";
        return ResponseEntity.ok(threatIntelService.importIocs(iocs, email));
    }
}
