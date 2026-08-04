package com.sentinelcore.repository;

import com.sentinelcore.model.NotificationPreference;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationPreferenceRepository extends MongoRepository<NotificationPreference, String> {

    Optional<NotificationPreference> findByUserId(String userId);

    Optional<NotificationPreference> findByUserEmail(String userEmail);
}
