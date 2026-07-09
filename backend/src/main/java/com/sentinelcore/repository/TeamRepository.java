package com.sentinelcore.repository;

import com.sentinelcore.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeamRepository extends JpaRepository<Team, String> {
    List<Team> findByTeamNameContainingIgnoreCase(String teamName);
}
