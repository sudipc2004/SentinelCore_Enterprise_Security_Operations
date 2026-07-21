package com.sentinelcore.repository;

import com.sentinelcore.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByIsReadFalseOrderByCreatedAtDesc();
}
