package com.sentinelcore.controller;

import com.sentinelcore.dto.TeamRequest;
import com.sentinelcore.dto.TeamResponse;
import com.sentinelcore.security.UserPrincipal;
import com.sentinelcore.service.TeamService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    @Autowired
    private TeamService teamService;

    @GetMapping
    public ResponseEntity<List<TeamResponse>> getAllTeams(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(teamService.getAllTeams(search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TeamResponse> getTeamById(@PathVariable String id) {
        return ResponseEntity.ok(teamService.getTeamById(id));
    }

    @PostMapping
    public ResponseEntity<TeamResponse> createTeam(
            @Valid @RequestBody TeamRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(teamService.createTeam(request, userPrincipal.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamResponse> updateTeam(
            @PathVariable String id,
            @Valid @RequestBody TeamRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(teamService.updateTeam(id, request, userPrincipal.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTeam(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        teamService.deleteTeam(id, userPrincipal.getUsername());
        return ResponseEntity.ok().body("Team deleted successfully.");
    }
}
