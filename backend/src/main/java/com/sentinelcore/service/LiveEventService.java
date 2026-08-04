package com.sentinelcore.service;

import com.sentinelcore.dto.LiveEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class LiveEventService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void broadcastEvent(String message, String severity) {
        LiveEvent event = LiveEvent.builder()
                ._id(UUID.randomUUID().toString())
                .message(message)
                .severity(severity)
                .timestamp(LocalDateTime.now())
                .build();
        
        messagingTemplate.convertAndSend("/topic/events", event);
    }
}
