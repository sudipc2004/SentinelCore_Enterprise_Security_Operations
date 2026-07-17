package com.sentinelcore.controller;

import com.sentinelcore.dto.IncidentRequest;
import com.sentinelcore.dto.IncidentResponse;
import com.sentinelcore.security.UserPrincipal;
import com.sentinelcore.service.IncidentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    @Autowired
    private IncidentService incidentService;

    @GetMapping
    public ResponseEntity<Page<IncidentResponse>> getIncidents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(incidentService.getIncidents(search, status, priority, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentResponse> getIncidentById(@PathVariable String id) {
        return ResponseEntity.ok(incidentService.getIncidentById(id));
    }

    @PostMapping
    public ResponseEntity<IncidentResponse> createIncident(
            @Valid @RequestBody IncidentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(incidentService.createIncident(request, userPrincipal.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IncidentResponse> updateIncident(
            @PathVariable String id,
            @Valid @RequestBody IncidentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(incidentService.updateIncident(id, request, userPrincipal));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteIncident(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        incidentService.deleteIncident(id, userPrincipal.getUsername());
        return ResponseEntity.ok().body("Incident deleted successfully.");
    }
}
