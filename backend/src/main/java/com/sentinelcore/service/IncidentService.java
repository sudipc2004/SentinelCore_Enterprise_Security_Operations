package com.sentinelcore.service;

import com.sentinelcore.dto.IncidentRequest;
import com.sentinelcore.dto.IncidentResponse;
import com.sentinelcore.dto.TeamResponse;
import com.sentinelcore.dto.UserResponse;
import com.sentinelcore.exception.BadRequestException;
import com.sentinelcore.exception.ForbiddenException;
import com.sentinelcore.exception.ResourceNotFoundException;
import com.sentinelcore.model.Alert;
import com.sentinelcore.model.Incident;
import com.sentinelcore.model.Role;
import com.sentinelcore.model.Team;
import com.sentinelcore.model.User;
import com.sentinelcore.repository.AlertRepository;
import com.sentinelcore.repository.IncidentRepository;
import com.sentinelcore.repository.TeamRepository;
import com.sentinelcore.repository.UserRepository;
import com.sentinelcore.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class IncidentService {

    private static final List<String> PRIORITIES = List.of("P1", "P2", "P3", "P4");
    private static final List<String> STATUSES = List.of("OPEN", "TRIAGED", "IN_PROGRESS", "RESOLVED", "CLOSED");

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private AuditLogService auditLogService;

    public Page<IncidentResponse> getIncidents(String search, String status, String priority, Pageable pageable) {
        Query query = new Query();
        List<Criteria> criteria = new ArrayList<>();

        if (StringUtils.hasText(search)) {
            Pattern pattern = Pattern.compile(Pattern.quote(search), Pattern.CASE_INSENSITIVE);
            criteria.add(new Criteria().orOperator(
                    Criteria.where("title").regex(pattern),
                    Criteria.where("description").regex(pattern),
                    Criteria.where("category").regex(pattern),
                    Criteria.where("source").regex(pattern)
            ));
        }

        if (StringUtils.hasText(status)) {
            criteria.add(Criteria.where("status").is(status));
        }

        if (StringUtils.hasText(priority)) {
            criteria.add(Criteria.where("priority").is(priority));
        }

        if (!criteria.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteria.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(query, Incident.class);
        query.with(pageable);
        List<IncidentResponse> incidents = mongoTemplate.find(query, Incident.class).stream()
                .map(this::mapToIncidentResponse)
                .collect(Collectors.toList());

        return new PageImpl<>(incidents, pageable, total);
    }

    public IncidentResponse getIncidentById(String id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + id));
        return mapToIncidentResponse(incident);
    }

    public IncidentResponse createIncident(IncidentRequest request, String currentUserEmail) {
        validateRequest(request);

        Incident incident = Incident.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(request.getStatus())
                .category(request.getCategory())
                .source(request.getSource())
                .assignedTo(request.getAssignedTo())
                .assignedTeam(request.getAssignedTeam())
                .dueAt(request.getDueAt())
                .resolvedAt(isResolved(request.getStatus()) ? LocalDateTime.now() : null)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Incident savedIncident = incidentRepository.save(incident);
        auditLogService.log(null, currentUserEmail, "INCIDENT_CREATED", "INCIDENT",
                "Created incident: " + savedIncident.getTitle());

        return mapToIncidentResponse(savedIncident);
    }

    public IncidentResponse createIncidentFromAlert(String alertId, String currentUserEmail) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found with id: " + alertId));
        
        if (StringUtils.hasText(alert.getIncidentId())) {
            throw new BadRequestException("An incident is already linked to this alert.");
        }
        
        String priority = "P3";
        if ("CRITICAL".equals(alert.getSeverity())) priority = "P1";
        else if ("HIGH".equals(alert.getSeverity())) priority = "P2";
        else if ("LOW".equals(alert.getSeverity())) priority = "P4";
        
        Incident incident = Incident.builder()
                .title("Incident from Alert: " + alert.getTitle())
                .description(alert.getDescription())
                .priority(priority)
                .status("OPEN")
                .category("SECURITY_ALERT")
                .source("ALERT_ENGINE")
                .alertId(alert.getId())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
                
        Incident savedIncident = incidentRepository.save(incident);
        
        alert.setIncidentId(savedIncident.getId());
        alertRepository.save(alert);
        
        auditLogService.log(null, currentUserEmail, "INCIDENT_CREATED", "INCIDENT",
                "Created incident: " + savedIncident.getTitle() + " from alert: " + alertId);
                
        return mapToIncidentResponse(savedIncident);
    }

    public IncidentResponse updateIncident(String id, IncidentRequest request, UserPrincipal userPrincipal) {
        validateRequest(request);

        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + id));

        User currentUser = userPrincipal.getUser();
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isAssignedUser = currentUser.getId().equals(incident.getAssignedTo());
        boolean isAssignedTeamLead = false;

        if (StringUtils.hasText(incident.getAssignedTeam())) {
            Team assignedTeam = teamRepository.findById(incident.getAssignedTeam()).orElse(null);
            isAssignedTeamLead = assignedTeam != null && currentUser.getId().equals(assignedTeam.getTeamLead());
        }

        if (!isAdmin && !isAssignedUser && !isAssignedTeamLead) {
            throw new ForbiddenException("Access denied. Only admins, the assignee, or the assigned team's lead can update this incident.");
        }

        boolean wasResolved = isResolved(incident.getStatus());
        boolean isNowResolved = isResolved(request.getStatus());

        incident.setTitle(request.getTitle());
        incident.setDescription(request.getDescription());
        incident.setPriority(request.getPriority());
        incident.setStatus(request.getStatus());
        incident.setCategory(request.getCategory());
        incident.setSource(request.getSource());
        incident.setAssignedTo(request.getAssignedTo());
        incident.setAssignedTeam(request.getAssignedTeam());
        incident.setDueAt(request.getDueAt());
        incident.setResolvedAt(!wasResolved && isNowResolved ? LocalDateTime.now() : incident.getResolvedAt());
        if (!isNowResolved) {
            incident.setResolvedAt(null);
        }
        incident.setUpdatedAt(LocalDateTime.now());

        Incident updatedIncident = incidentRepository.save(incident);
        auditLogService.log(currentUser.getId(), currentUser.getEmail(), "INCIDENT_UPDATED", "INCIDENT",
                "Updated incident: " + updatedIncident.getTitle());

        return mapToIncidentResponse(updatedIncident);
    }

    public void deleteIncident(String id, String currentUserEmail) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + id));

        incidentRepository.delete(incident);
        auditLogService.log(null, currentUserEmail, "INCIDENT_DELETED", "INCIDENT",
                "Deleted incident: " + incident.getTitle());
    }

    private void validateRequest(IncidentRequest request) {
        if (!PRIORITIES.contains(request.getPriority())) {
            throw new BadRequestException("Priority must be one of P1, P2, P3, or P4.");
        }

        if (!STATUSES.contains(request.getStatus())) {
            throw new BadRequestException("Status must be OPEN, TRIAGED, IN_PROGRESS, RESOLVED, or CLOSED.");
        }

        if (StringUtils.hasText(request.getAssignedTo())) {
            User assignee = userRepository.findById(request.getAssignedTo())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found."));
            if (assignee.getRole() == Role.VIEWER) {
                throw new BadRequestException("Viewer users cannot be assigned to investigate incidents.");
            }
        }

        if (StringUtils.hasText(request.getAssignedTeam())) {
            teamRepository.findById(request.getAssignedTeam())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned team not found."));
        }
    }

    private boolean isResolved(String status) {
        return "RESOLVED".equals(status) || "CLOSED".equals(status);
    }

    private IncidentResponse mapToIncidentResponse(Incident incident) {
        UserResponse assignee = null;
        if (StringUtils.hasText(incident.getAssignedTo())) {
            User user = userRepository.findById(incident.getAssignedTo()).orElse(null);
            assignee = UserResponse.fromUser(user);
        }

        TeamResponse assignedTeam = null;
        if (StringUtils.hasText(incident.getAssignedTeam())) {
            Team team = teamRepository.findById(incident.getAssignedTeam()).orElse(null);
            if (team != null) {
                assignedTeam = TeamResponse.builder()
                        .id(team.getId())
                        .teamName(team.getTeamName())
                        .department(team.getDepartment())
                        .description(team.getDescription())
                        .createdAt(team.getCreatedAt())
                        .updatedAt(team.getUpdatedAt())
                        .build();
            }
        }

        return IncidentResponse.fromIncident(incident, assignee, assignedTeam);
    }
}
