package com.sentinelcore.service;

import com.sentinelcore.dto.TeamDto;
import com.sentinelcore.model.Team;
import com.sentinelcore.model.User;
import com.sentinelcore.repository.TeamRepository;
import com.sentinelcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Team> findAll(String search) {
        if (search != null && !search.trim().isEmpty()) {
            return teamRepository.findByTeamNameContainingIgnoreCase(search);
        }
        return teamRepository.findAll();
    }

    public Optional<Team> findById(String id) {
        return teamRepository.findById(id);
    }

    public Team createTeam(TeamDto dto) {
        Team team = new Team();
        team.setTeamName(dto.getTeamName());
        team.setDepartment(dto.getDepartment());
        team.setDescription(dto.getDescription());
        team.setCreatedAt(Instant.now());

        if (dto.getTeamLead() != null && !dto.getTeamLead().trim().isEmpty()) {
            User teamLead = userRepository.findById(dto.getTeamLead())
                    .orElseThrow(() -> new IllegalArgumentException("Team lead user not found"));
            team.setTeamLead(teamLead);
        }

        if (dto.getMembers() != null && !dto.getMembers().isEmpty()) {
            List<User> members = new ArrayList<>();
            for (String memberId : dto.getMembers()) {
                userRepository.findById(memberId).ifPresent(members::add);
            }
            team.setMembers(members);
        }

        return teamRepository.save(team);
    }

    public Team updateTeam(String id, TeamDto dto) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        team.setTeamName(dto.getTeamName());
        team.setDepartment(dto.getDepartment());
        team.setDescription(dto.getDescription());

        if (dto.getTeamLead() != null && !dto.getTeamLead().trim().isEmpty()) {
            User teamLead = userRepository.findById(dto.getTeamLead())
                    .orElseThrow(() -> new IllegalArgumentException("Team lead user not found"));
            team.setTeamLead(teamLead);
        } else {
            team.setTeamLead(null);
        }

        List<User> members = new ArrayList<>();
        if (dto.getMembers() != null && !dto.getMembers().isEmpty()) {
            for (String memberId : dto.getMembers()) {
                userRepository.findById(memberId).ifPresent(members::add);
            }
        }
        team.setMembers(members);

        return teamRepository.save(team);
    }

    public void deleteTeam(String id) {
        teamRepository.deleteById(id);
    }
}
