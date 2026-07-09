package com.sentinelcore.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String id;
    private String name;
    private String email;
    private String role;
    private String department;
}
