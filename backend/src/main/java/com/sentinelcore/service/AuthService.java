package com.sentinelcore.service;

import com.sentinelcore.dto.LoginRequest;
import com.sentinelcore.dto.LoginResponse;
import com.sentinelcore.dto.RegisterRequest;
import com.sentinelcore.dto.UserResponse;
import com.sentinelcore.exception.BadRequestException;
import com.sentinelcore.model.Role;
import com.sentinelcore.model.User;
import com.sentinelcore.repository.UserRepository;
import com.sentinelcore.security.JwtTokenProvider;
import com.sentinelcore.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private AuditLogService auditLogService;

    public UserResponse register(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new BadRequestException("Email address already in use.");
        }

        Role role = registerRequest.getRole() == null ? Role.VIEWER : registerRequest.getRole();
        if (role == Role.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be created through registration.");
        }

        User user = User.builder()
                .name(registerRequest.getName())
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(role)
                .department(registerRequest.getDepartment())
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        // Audit Log
        auditLogService.log(savedUser.getId(), savedUser.getEmail(), "USER_CREATED", "AUTH", 
                "Registered new user via register API: " + savedUser.getEmail());

        return UserResponse.fromUser(savedUser);
    }

    public LoginResponse login(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // Audit Log
            auditLogService.log(user.getId(), user.getEmail(), "LOGIN_SUCCESS", "AUTH", 
                    "Successful login for email: " + user.getEmail());

            return new LoginResponse(
                    jwt,
                    user.getId(),
                    user.getName(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getDepartment()
            );
        } catch (DisabledException ex) {
            auditLogService.log(null, loginRequest.getEmail(), "LOGIN_FAILED", "AUTH",
                    "Inactive account login attempt for email: " + loginRequest.getEmail());
            throw new BadRequestException("Your account is inactive. Please contact your administrator.");
        } catch (Exception ex) {
            // Log failed login
            auditLogService.log(null, loginRequest.getEmail(), "LOGIN_FAILED", "AUTH", 
                    "Failed login attempt for email: " + loginRequest.getEmail() + ". Reason: " + ex.getMessage());
            throw new BadRequestException("Invalid email or password.");
        }
    }

    public void logout(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        String userId = user != null ? user.getId() : null;
        auditLogService.log(userId, email, "LOGOUT", "AUTH", "User logged out: " + email);
    }
}
