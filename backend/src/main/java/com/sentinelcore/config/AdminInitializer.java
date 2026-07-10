package com.sentinelcore.config;

import com.sentinelcore.model.Role;
import com.sentinelcore.model.User;
import com.sentinelcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${sentinel.admin.name:Sentinel Admin}")
    private String adminName;

    @Value("${sentinel.admin.email:admin@sentinelcore.in}")
    private String adminEmail;

    @Value("${sentinel.admin.password:Admin@123}")
    private String adminPassword;

    @Value("${sentinel.admin.department:Security Operations}")
    private String adminDepartment;

    public AdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        if (admins.size() > 1) {
            throw new IllegalStateException("Only one admin account is allowed. Found: " + admins.size());
        }

        if (admins.size() == 1) {
            syncConfiguredAdmin(admins.get(0));
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        User admin = User.builder()
                .name(adminName)
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .role(Role.ADMIN)
                .department(adminDepartment)
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();

        userRepository.save(admin);
    }

    private void syncConfiguredAdmin(User admin) {
        userRepository.findByEmail(adminEmail)
                .filter(user -> !user.getId().equals(admin.getId()))
                .ifPresent(user -> {
                    throw new IllegalStateException("Configured admin email is already used by another account: " + adminEmail);
                });

        admin.setName(adminName);
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setDepartment(adminDepartment);
        admin.setStatus("ACTIVE");
        admin.setUpdatedAt(LocalDateTime.now());

        userRepository.save(admin);
    }
}
