package com.sentinelcore.controller;

import com.sentinelcore.repository.AuditLogRepository;
import com.sentinelcore.repository.TeamRepository;
import com.sentinelcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus("ACTIVE");
        long totalTeams = teamRepository.count();

        var recentUsers = userRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();

        var recentTeams = teamRepository.findAll(
                PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).getContent();

        var recentLogins = auditLogRepository.findTop5ByActionInOrderByTimestampDesc(
                Arrays.asList("LOGIN_SUCCESS", "LOGIN_FAILED")
        );

        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "activeUsers", activeUsers,
                "totalTeams", totalTeams,
                "recentUsers", recentUsers,
                "recentTeams", recentTeams,
                "recentLogins", recentLogins
        ));
    }
}
