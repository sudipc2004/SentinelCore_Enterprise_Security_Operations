package com.sentinelcore.repository;

import com.sentinelcore.model.Playbook;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaybookRepository extends MongoRepository<Playbook, String> {
    List<Playbook> findByStatus(String status);
    Optional<Playbook> findByLinkedAlertRuleId(String linkedAlertRuleId);
}
