package com.sentinelcore.service;

import com.sentinelcore.dto.UserResponse;
import com.sentinelcore.model.AuditLog;
import com.sentinelcore.model.Team;
import com.sentinelcore.model.User;
import com.sentinelcore.repository.TeamRepository;
import com.sentinelcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus("ACTIVE");
        long totalTeams = teamRepository.count();

        // Recent users (last 5)
        Query recentUsersQuery = new Query().with(Sort.by(Sort.Direction.DESC, "createdAt")).limit(5);
        List<User> recentUsers = mongoTemplate.find(recentUsersQuery, User.class);
        List<UserResponse> recentUserResponses = recentUsers.stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());

        // Recent teams (last 5)
        Query recentTeamsQuery = new Query().with(Sort.by(Sort.Direction.DESC, "createdAt")).limit(5);
        List<Team> recentTeams = mongoTemplate.find(recentTeamsQuery, Team.class);

        // Recent login activity (last 5 login events)
        Query recentLoginsQuery = new Query(
                Criteria.where("action").in("LOGIN_SUCCESS", "LOGIN_FAILED")
        ).with(Sort.by(Sort.Direction.DESC, "timestamp")).limit(5);
        List<AuditLog> recentLogins = mongoTemplate.find(recentLoginsQuery, AuditLog.class);

        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("totalTeams", totalTeams);
        stats.put("recentUsers", recentUserResponses);
        stats.put("recentTeams", recentTeams);
        stats.put("recentLogins", recentLogins);

        return stats;
    }
}
