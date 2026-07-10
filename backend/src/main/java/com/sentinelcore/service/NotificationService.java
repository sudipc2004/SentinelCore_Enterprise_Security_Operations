package com.sentinelcore.service;

import com.sentinelcore.model.Alert;
import com.sentinelcore.model.Notification;
import com.sentinelcore.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationRepository notificationRepository;

    public void sendAlert(Alert alert) {
        // Broadcast the alert to WebSocket subscribers
        messagingTemplate.convertAndSend("/topic/alerts", alert);

        // Also create an in-app notification for the alert
        Notification notification = new Notification();
        notification.setTitle("Security Alert Raised: " + alert.getAlertId());
        notification.setMessage(alert.getDescription());
        notification.setSeverity(alert.getSeverity());
        notification.setRead(false);
        saveAndBroadcastNotification(notification);
    }

    public void sendNotification(String title, String message, String severity) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setSeverity(severity);
        notification.setRead(false);
        saveAndBroadcastNotification(notification);
    }

    private void saveAndBroadcastNotification(Notification notification) {
        Notification saved = notificationRepository.save(notification);
        // Broadcast to WebSocket subscribers
        messagingTemplate.convertAndSend("/topic/notifications", saved);
    }

    public List<Notification> getUnreadNotifications() {
        return notificationRepository.findByReadFalseOrderByCreatedAtDesc();
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findTop10ByOrderByCreatedAtDesc();
    }

    public void markAsRead(String id) {
        notificationRepository.findById(id).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    public void markAllAsRead() {
        List<Notification> unread = notificationRepository.findByReadFalseOrderByCreatedAtDesc();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }
}
