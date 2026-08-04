package com.sentinelcore.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notification_preferences")
public class NotificationPreference {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    @Indexed
    private String userEmail;

    // Channel id -> Map of channel properties (enabled, address, webhook, etc.)
    @Builder.Default
    private Map<String, Map<String, Object>> channels = new HashMap<>();

    // Event type id -> Boolean toggle
    @Builder.Default
    private Map<String, Boolean> events = new HashMap<>();

    // Escalation chain step definitions
    @Builder.Default
    private List<Map<String, Object>> escalationChain = new ArrayList<>();

    // Quiet hours configuration
    @Builder.Default
    private Map<String, Object> quietHours = new HashMap<>();

    // Alert digest configuration
    @Builder.Default
    private Map<String, Object> digest = new HashMap<>();

    // IDs of notifications read or dismissed by this user
    @Builder.Default
    private Set<String> readNotificationIds = new HashSet<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
