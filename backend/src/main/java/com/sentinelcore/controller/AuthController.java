package com.sentinelcore.controller;

import com.sentinelcore.dto.LoginRequest;
import com.sentinelcore.dto.LoginResponse;
import com.sentinelcore.model.User;
import com.sentinelcore.security.JwtService;
import com.sentinelcore.service.AuditLogService;
import com.sentinelcore.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user, HttpServletRequest request) {
        try {
            User registeredUser = userService.registerUser(user);
            auditLogService.log(
                    registeredUser.getEmail(),
                    "USER_REGISTER",
                    "AUTH",
                    request.getRemoteAddr(),
                    "User registered with email: " + registeredUser.getEmail()
            );
            return ResponseEntity.ok(registeredUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        String email = loginRequest.getEmail();
        Optional<User> userOpt = userService.findByEmail(email);

        if (userOpt.isEmpty()) {
            auditLogService.log(
                    email,
                    "LOGIN_FAILED",
                    "AUTH",
                    request.getRemoteAddr(),
                    "Failed login attempt: user with email " + email + " does not exist"
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
        }

        User user = userOpt.get();
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            auditLogService.log(
                    email,
                    "LOGIN_FAILED",
                    "AUTH",
                    request.getRemoteAddr(),
                    "Failed login attempt: account is INACTIVE"
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "User account is suspended"));
        }

        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            auditLogService.log(
                    email,
                    "LOGIN_FAILED",
                    "AUTH",
                    request.getRemoteAddr(),
                    "Failed login attempt: incorrect password"
            );
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password"));
        }

        // Success
        String token = jwtService.generateToken(user);
        auditLogService.log(
                email,
                "LOGIN_SUCCESS",
                "AUTH",
                request.getRemoteAddr(),
                "User logged in successfully"
        );

        LoginResponse response = new LoginResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getDepartment(),
                user.getStatus(),
                user.getCreatedAt()
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@AuthenticationPrincipal User user, HttpServletRequest request) {
        if (user != null) {
            auditLogService.log(
                    user.getEmail(),
                    "LOGOUT",
                    "AUTH",
                    request.getRemoteAddr(),
                    "User logged out successfully"
            );
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/profile")
    public ResponseEntity<?> profile(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        return ResponseEntity.ok(user);
    }
}
