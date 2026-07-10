package com.sentinelcore.repository;

import com.sentinelcore.model.Team;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends MongoRepository<Team, String> {
    List<Team> findByTeamNameRegexIgnoreCase(String teamName);
    boolean existsByTeamName(String teamName);
}
