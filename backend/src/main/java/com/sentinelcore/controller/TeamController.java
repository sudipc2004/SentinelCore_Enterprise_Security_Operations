package com.sentinelcore.controller;

import com.sentinelcore.dto.TeamDto;
import com.sentinelcore.model.Role;
import com.sentinelcore.model.Team;
import com.sentinelcore.model.User;
import com.sentinelcore.service.AuditLogService;
import com.sentinelcore.service.TeamService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    @Autowired
    private TeamService teamService;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<Team>> getAllTeams(@RequestParam(required = false) String search) {
        return ResponseEntity.ok(teamService.findAll(search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTeamById(@PathVariable String id) {
        return teamService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createTeam(
            @RequestBody TeamDto teamDto,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest request
    ) {
        if (currentUser == null || currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only admins can create teams."));
        }
        try {
            Team created = teamService.createTeam(teamDto);
            auditLogService.log(
                    currentUser.getEmail(),
                    "TEAM_CREATE",
                    "TEAMS",
                    request.getRemoteAddr(),
                    "Admin created team: " + created.getTeamName()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTeam(
            @PathVariable String id,
            @RequestBody TeamDto teamDto,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest request
    ) {
        if (currentUser == null || currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only admins can update teams."));
        }
        try {
            Team updated = teamService.updateTeam(id, teamDto);
            auditLogService.log(
                    currentUser.getEmail(),
                    "TEAM_UPDATE",
                    "TEAMS",
                    request.getRemoteAddr(),
                    "Admin updated team: " + updated.getTeamName()
            );
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTeam(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest request
    ) {
        if (currentUser == null || currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only admins can delete teams."));
        }

        return teamService.findById(id).map(team -> {
            teamService.deleteTeam(id);
            auditLogService.log(
                    currentUser.getEmail(),
                    "TEAM_DELETE",
                    "TEAMS",
                    request.getRemoteAddr(),
                    "Admin deleted team: " + team.getTeamName()
            );
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
