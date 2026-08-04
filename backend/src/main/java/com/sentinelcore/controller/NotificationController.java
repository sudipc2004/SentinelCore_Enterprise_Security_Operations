package com.sentinelcore.controller;

import com.sentinelcore.model.NotificationPreference;
import com.sentinelcore.security.UserPrincipal;
import com.sentinelcore.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getNotifications(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(notificationService.getNotifications(userPrincipal));
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(notificationService.getSummary(userPrincipal));
    }

    @GetMapping("/preferences")
    public ResponseEntity<?> getPreferences(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(notificationService.getPreferences(userPrincipal));
    }

    @GetMapping("/escalation-sequence")
    public ResponseEntity<?> getEscalationSequence(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(notificationService.getEscalationSequence(userPrincipal));
    }

    @PutMapping("/preferences")
    public ResponseEntity<?> savePreferences(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                            @RequestBody NotificationPreference prefs) {
        return ResponseEntity.ok(notificationService.savePreferences(userPrincipal, prefs));
    }

    @PostMapping("/read/{id}")
    public ResponseEntity<?> markAsRead(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                         @PathVariable String id) {
        notificationService.markAsRead(userPrincipal, id);
        return ResponseEntity.ok().body(Map.of("message", "Notification marked as read", "id", id));
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.markAllAsRead(userPrincipal);
        return ResponseEntity.ok().body(Map.of("message", "All notifications marked as read"));
    }

    @PostMapping("/test-channel/{channelId}")
    public ResponseEntity<?> testChannel(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                          @PathVariable String channelId,
                                          @RequestBody(required = false) Map<String, Object> config) {
        return ResponseEntity.ok(notificationService.testChannel(userPrincipal, channelId, config));
    }
}

