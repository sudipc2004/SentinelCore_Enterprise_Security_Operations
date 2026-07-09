package com.sentinelcore.repository;

import com.sentinelcore.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    Page<AuditLog> findAll(Pageable pageable);
    List<AuditLog> findTop5ByActionInOrderByTimestampDesc(List<String> actions);
    List<AuditLog> findTop5ByOrderByTimestampDesc();
}
