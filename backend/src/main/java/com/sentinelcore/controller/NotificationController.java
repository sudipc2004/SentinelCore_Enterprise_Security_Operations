package com.sentinelcore.controller;

import com.sentinelcore.model.Notification;
import com.sentinelcore.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<?> getNotifications(@RequestParam(defaultValue = "false") boolean all) {
        List<Notification> list = all ? notificationService.getAllNotifications() : notificationService.getUnreadNotifications();
        return ResponseEntity.ok(list);
    }

    @PostMapping("/read/{id}")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok().build();
    }
}
