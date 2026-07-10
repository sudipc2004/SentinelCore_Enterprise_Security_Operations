package com.sentinelcore.config;

import com.sentinelcore.model.Role;
import com.sentinelcore.model.User;
import com.sentinelcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setName("System Administrator");
            admin.setEmail("admin@sentinelcore.in");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            admin.setDepartment("Cyber Security Operations");
            admin.setStatus("ACTIVE");
            admin.setCreatedAt(LocalDateTime.now());
            userRepository.save(admin);

            System.out.println("=================================================");
            System.out.println("   SENTINEL CORE SECURITY PLATFORM INITIALIZED   ");
            System.out.println("=================================================");
            System.out.println(" Seeded default Administrator account:");
            System.out.println(" Email:    admin@sentinelcore.in");
            System.out.println(" Password: admin123");
            System.out.println(" Role:     ADMIN");
            System.out.println("=================================================");
        }
    }
}
