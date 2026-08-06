package com.sentinelcore.controller;

import com.sentinelcore.model.Playbook;
import com.sentinelcore.security.UserPrincipal;
import com.sentinelcore.service.PlaybookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/playbooks")
public class PlaybookController {

    @Autowired
    private PlaybookService playbookService;

    @GetMapping
    public ResponseEntity<List<Playbook>> getPlaybooks() {
        return ResponseEntity.ok(playbookService.getPlaybooks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Playbook> getPlaybook(@PathVariable String id) {
        return ResponseEntity.ok(playbookService.getPlaybook(id));
    }

    @PostMapping
    public ResponseEntity<Playbook> createPlaybook(
            @RequestBody Playbook playbook,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(playbookService.createPlaybook(playbook, userPrincipal.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Playbook> updatePlaybook(
            @PathVariable String id,
            @RequestBody Playbook playbook,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(playbookService.updatePlaybook(id, playbook, userPrincipal.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletePlaybook(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        playbookService.deletePlaybook(id, userPrincipal.getUsername());
        return ResponseEntity.ok(Map.of("message", "Playbook deleted successfully."));
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<Map<String, Object>> runPlaybook(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> inputParams,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(playbookService.runPlaybook(id, userPrincipal.getUsername(), inputParams));
    }

    @PostMapping("/{id}/simulate")
    public ResponseEntity<Map<String, Object>> runSimulation(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> inputParams,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(playbookService.runPlaybook(id, userPrincipal.getUsername(), inputParams));
    }

    @GetMapping("/alert-rules")
    public ResponseEntity<List<Map<String, Object>>> getAlertRules() {
        return ResponseEntity.ok(playbookService.getAlertRules());
    }
}
