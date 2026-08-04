package com.sentinelcore.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveEvent {
    private String _id;
    private String message;
    private String severity;
    private LocalDateTime timestamp;
}
