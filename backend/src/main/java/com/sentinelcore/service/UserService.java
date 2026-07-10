package com.sentinelcore.service;

import com.sentinelcore.dto.RegisterRequest;
import com.sentinelcore.dto.UserResponse;
import com.sentinelcore.exception.BadRequestException;
import com.sentinelcore.exception.ResourceNotFoundException;
import com.sentinelcore.model.Role;
import com.sentinelcore.model.User;
import com.sentinelcore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private AuditLogService auditLogService;

    public Page<UserResponse> getUsers(String search, Role role, String department, Pageable pageable) {
        Query query = new Query().with(pageable);
        List<Criteria> criteriaList = new ArrayList<>();

        if (StringUtils.hasText(search)) {
            Criteria searchCriteria = new Criteria().orOperator(
                    Criteria.where("name").regex(search, "i"),
                    Criteria.where("email").regex(search, "i")
            );
            criteriaList.add(searchCriteria);
        }

        if (role != null) {
            criteriaList.add(Criteria.where("role").is(role));
        }

        if (StringUtils.hasText(department)) {
            criteriaList.add(Criteria.where("department").regex(department, "i"));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        long total = mongoTemplate.count(Query.of(query).limit(-1).skip(-1), User.class);
        List<User> users = mongoTemplate.find(query, User.class);

        List<UserResponse> userResponses = users.stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());

        return new PageImpl<>(userResponses, pageable, total);
    }

    public UserResponse getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return UserResponse.fromUser(user);
    }

    public UserResponse createUser(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered.");
        }

        Role requestedRole = request.getRole() == null ? Role.VIEWER : request.getRole();
        validateSingleAdmin(requestedRole, null);

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(requestedRole)
                .department(request.getDepartment())
                .status("ACTIVE")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(user);

        // Audit Log
        auditLogService.log(savedUser.getId(), savedUser.getEmail(), "USER_CREATED", "USER", 
                "Created user account: " + savedUser.getEmail() + " with role: " + savedUser.getRole());

        return UserResponse.fromUser(savedUser);
    }

    public UserResponse updateUser(String id, RegisterRequest request, String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        // If email changes, check uniqueness
        if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered.");
        }

        String oldRole = user.getRole().name();
        Role requestedRole = request.getRole();
        if (requestedRole != null) {
            validateSingleAdmin(requestedRole, user);
        }

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        if (StringUtils.hasText(request.getPassword())) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getRole() != null) {
            user.setRole(request.getRole());
        }
        user.setDepartment(request.getDepartment());
        user.setUpdatedAt(LocalDateTime.now());

        User updatedUser = userRepository.save(user);

        // Audit Log for role change
        if (request.getRole() != null && !oldRole.equals(request.getRole().name())) {
            auditLogService.log(updatedUser.getId(), updatedUser.getEmail(), "ROLE_ASSIGNED", "USER", 
                    "Role changed from " + oldRole + " to " + request.getRole().name() + " by " + currentAdminEmail);
        } else {
            auditLogService.log(updatedUser.getId(), updatedUser.getEmail(), "USER_UPDATED", "USER", 
                    "Updated user account: " + updatedUser.getEmail() + " by " + currentAdminEmail);
        }

        return UserResponse.fromUser(updatedUser);
    }

    private void validateSingleAdmin(Role requestedRole, User existingUser) {
        if (requestedRole != Role.ADMIN) {
            return;
        }

        boolean isExistingAdmin = existingUser != null && existingUser.getRole() == Role.ADMIN;
        if (!isExistingAdmin && userRepository.countByRole(Role.ADMIN) > 0) {
            throw new BadRequestException("Only one admin account is allowed.");
        }
    }

    public UserResponse updateUserStatus(String id, String status, String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (!"ACTIVE".equalsIgnoreCase(status) && !"INACTIVE".equalsIgnoreCase(status)) {
            throw new BadRequestException("Invalid status value. Must be ACTIVE or INACTIVE.");
        }

        user.setStatus(status.toUpperCase());
        user.setUpdatedAt(LocalDateTime.now());
        User updatedUser = userRepository.save(user);

        // Audit Log
        String action = "ACTIVE".equalsIgnoreCase(status) ? "USER_ACTIVATED" : "USER_DEACTIVATED";
        auditLogService.log(updatedUser.getId(), updatedUser.getEmail(), action, "USER", 
                "User account status changed to " + status + " by " + currentAdminEmail);

        return UserResponse.fromUser(updatedUser);
    }

    public void deleteUser(String id, String currentAdminEmail) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        
        userRepository.delete(user);

        // Audit Log
        auditLogService.log(user.getId(), user.getEmail(), "USER_DELETED", "USER", 
                "Deleted user account: " + user.getEmail() + " by " + currentAdminEmail);
    }
}
