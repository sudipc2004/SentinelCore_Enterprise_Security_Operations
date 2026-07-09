package com.sentinelcore.controller;

import com.sentinelcore.model.Role;
import com.sentinelcore.model.User;
import com.sentinelcore.service.AuditLogService;
import com.sentinelcore.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<Page<User>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String department
    ) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<User> usersPage = userService.searchUsers(search, role, department, pageable);
        return ResponseEntity.ok(usersPage);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createUser(
            @RequestBody User user,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest request
    ) {
        if (currentUser == null || currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only admins can add users."));
        }
        try {
            User created = userService.createUser(user);
            auditLogService.log(
                    currentUser.getEmail(),
                    "USER_CREATE",
                    "USERS",
                    request.getRemoteAddr(),
                    "Admin created user with email: " + created.getEmail()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable String id,
            @RequestBody User userDetails,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest request
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
        
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;
        boolean isSelf = currentUser.getId().equals(id);
        
        if (!isAdmin && !isSelf) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied."));
        }

        try {
            if (!isAdmin) {
                userDetails.setRole(currentUser.getRole());
            }
            User updated = userService.updateUser(id, userDetails);
            auditLogService.log(
                    currentUser.getEmail(),
                    "USER_UPDATE",
                    "USERS",
                    request.getRemoteAddr(),
                    "Profile updated for user: " + updated.getEmail()
            );
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest request
    ) {
        if (currentUser == null || currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only admins can change user status."));
        }
        
        String status = body.get("status");
        if (status == null || (!status.equalsIgnoreCase("ACTIVE") && !status.equalsIgnoreCase("INACTIVE"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid status value"));
        }

        try {
            User updated = userService.updateStatus(id, status);
            auditLogService.log(
                    currentUser.getEmail(),
                    "USER_STATUS_UPDATE",
                    "USERS",
                    request.getRemoteAddr(),
                    "Admin changed status of user " + updated.getEmail() + " to " + updated.getStatus()
            );
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest request
    ) {
        if (currentUser == null || currentUser.getRole() != Role.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Only admins can delete users."));
        }

        return userService.findById(id).map(user -> {
            userService.deleteUser(id);
            auditLogService.log(
                    currentUser.getEmail(),
                    "USER_DELETE",
                    "USERS",
                    request.getRemoteAddr(),
                    "Admin deleted user: " + user.getEmail()
            );
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
