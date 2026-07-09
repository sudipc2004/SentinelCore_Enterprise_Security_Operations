package com.sentinelcore.repository;

import com.sentinelcore.model.Role;
import com.sentinelcore.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    long countByStatus(String status);

    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR :search = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:department IS NULL OR :department = '' OR LOWER(u.department) LIKE LOWER(CONCAT('%', :department, '%')))")
    Page<User> searchUsers(
            @Param("search") String search,
            @Param("role") Role role,
            @Param("department") String department,
            Pageable pageable
    );
}
