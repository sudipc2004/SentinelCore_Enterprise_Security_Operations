package com.sentinelcore.repository;

import com.sentinelcore.model.AnalystNote;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalystNoteRepository extends MongoRepository<AnalystNote, String> {
    List<AnalystNote> findByTargetIdAndTargetType(String targetId, String targetType);
}
