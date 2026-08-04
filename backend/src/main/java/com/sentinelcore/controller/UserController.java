package com.sentinelcore.controller;

import com.sentinelcore.dto.RegisterRequest;
import com.sentinelcore.dto.UserResponse;
import com.sentinelcore.exception.BadRequestException;
import com.sentinelcore.model.Role;
import com.sentinelcore.security.UserPrincipal;
import com.sentinelcore.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    public ResponseEntity<Page<UserResponse>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        return ResponseEntity.ok(userService.getUsers(search, role, department, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable String id,
            @Valid @RequestBody RegisterRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        boolean isAdmin = userPrincipal.getUser().getRole() == Role.ADMIN;
        boolean isSelf = userPrincipal.getUser().getId().equals(id);

        if (!isAdmin && !isSelf) {
            throw new BadRequestException("Access denied. You can only update your own profile.");
        }

        // If not admin, restrict the role updates to keep it matching current user's role
        if (!isAdmin) {
            request.setRole(userPrincipal.getUser().getRole());
        }

        return ResponseEntity.ok(userService.updateUser(id, request, userPrincipal.getUsername()));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateUserStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        String status = body.get("status");
        if (status == null) {
            throw new BadRequestException("Status is required.");
        }
        return ResponseEntity.ok(userService.updateUserStatus(id, status, userPrincipal.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        userService.deleteUser(id, userPrincipal.getUsername());
        return ResponseEntity.ok().body("User deleted successfully.");
    }
}
