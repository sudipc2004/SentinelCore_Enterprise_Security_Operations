package com.sentinelcore.repository;

import com.sentinelcore.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByReadFalseOrderByCreatedAtDesc();
    List<Notification> findTop10ByOrderByCreatedAtDesc();
}
