package com.sentinelcore.service;

import com.sentinelcore.dto.TeamRequest;
import com.sentinelcore.dto.TeamResponse;
import com.sentinelcore.dto.UserResponse;
import com.sentinelcore.exception.BadRequestException;
import com.sentinelcore.exception.ResourceNotFoundException;
import com.sentinelcore.model.Team;
import com.sentinelcore.model.User;
import com.sentinelcore.repository.TeamRepository;
import com.sentinelcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    public List<TeamResponse> getAllTeams(String search) {
        List<Team> teams;
        if (StringUtils.hasText(search)) {
            teams = teamRepository.findByTeamNameRegexIgnoreCase(search);
        } else {
            teams = teamRepository.findAll();
        }

        return teams.stream()
                .map(this::mapToTeamResponse)
                .collect(Collectors.toList());
    }

    public TeamResponse getTeamById(String id) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));
        return mapToTeamResponse(team);
    }

    public TeamResponse createTeam(TeamRequest request, String currentAdminEmail) {
        if (teamRepository.existsByTeamName(request.getTeamName())) {
            throw new BadRequestException("Team name already exists.");
        }

        // Verify team lead exists if provided
        if (StringUtils.hasText(request.getTeamLead())) {
            userRepository.findById(request.getTeamLead())
                    .orElseThrow(() -> new ResourceNotFoundException("Team lead user not found."));
        }

        Team team = Team.builder()
                .teamName(request.getTeamName())
                .department(request.getDepartment())
                .teamLead(request.getTeamLead())
                .members(request.getMembers() == null ? new ArrayList<>() : request.getMembers())
                .description(request.getDescription())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Team savedTeam = teamRepository.save(team);

        // Audit Log
        auditLogService.log(null, currentAdminEmail, "TEAM_CREATED", "TEAM", 
                "Created team: " + savedTeam.getTeamName() + " by admin: " + currentAdminEmail);

        return mapToTeamResponse(savedTeam);
    }

    public TeamResponse updateTeam(String id, TeamRequest request, String currentAdminEmail) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));

        if (!team.getTeamName().equalsIgnoreCase(request.getTeamName()) && teamRepository.existsByTeamName(request.getTeamName())) {
            throw new BadRequestException("Team name already exists.");
        }

        // Verify team lead exists if provided
        if (StringUtils.hasText(request.getTeamLead())) {
            userRepository.findById(request.getTeamLead())
                    .orElseThrow(() -> new ResourceNotFoundException("Team lead user not found."));
        }

        team.setTeamName(request.getTeamName());
        team.setDepartment(request.getDepartment());
        team.setTeamLead(request.getTeamLead());
        team.setMembers(request.getMembers() == null ? new ArrayList<>() : request.getMembers());
        team.setDescription(request.getDescription());
        team.setUpdatedAt(LocalDateTime.now());

        Team updatedTeam = teamRepository.save(team);

        // Audit Log
        auditLogService.log(null, currentAdminEmail, "TEAM_UPDATED", "TEAM", 
                "Updated team: " + updatedTeam.getTeamName() + " by admin: " + currentAdminEmail);

        return mapToTeamResponse(updatedTeam);
    }

    public void deleteTeam(String id, String currentAdminEmail) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + id));

        teamRepository.delete(team);

        // Audit Log
        auditLogService.log(null, currentAdminEmail, "TEAM_DELETED", "TEAM", 
                "Deleted team: " + team.getTeamName() + " by admin: " + currentAdminEmail);
    }

    private TeamResponse mapToTeamResponse(Team team) {
        UserResponse teamLeadResponse = null;
        if (StringUtils.hasText(team.getTeamLead())) {
            User lead = userRepository.findById(team.getTeamLead()).orElse(null);
            teamLeadResponse = UserResponse.fromUser(lead);
        }

        List<UserResponse> membersResponses = new ArrayList<>();
        if (team.getMembers() != null && !team.getMembers().isEmpty()) {
            List<User> members = userRepository.findAllById(team.getMembers());
            membersResponses = members.stream()
                    .map(UserResponse::fromUser)
                    .collect(Collectors.toList());
        }

        return TeamResponse.builder()
                .id(team.getId())
                .teamName(team.getTeamName())
                .department(team.getDepartment())
                .teamLead(teamLeadResponse)
                .members(membersResponses)
                .description(team.getDescription())
                .createdAt(team.getCreatedAt())
                .updatedAt(team.getUpdatedAt())
                .build();
    }
}
