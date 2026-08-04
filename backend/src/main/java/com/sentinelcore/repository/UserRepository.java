package com.sentinelcore.repository;

import com.sentinelcore.model.User;
import com.sentinelcore.model.Role;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(Role role);
    boolean existsByEmail(String email);
    long countByRole(Role role);
    long countByStatus(String status);
}
