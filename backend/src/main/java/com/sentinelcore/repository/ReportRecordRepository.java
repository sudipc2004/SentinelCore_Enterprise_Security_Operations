package com.sentinelcore.repository;

import com.sentinelcore.model.ReportRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportRecordRepository extends MongoRepository<ReportRecord, String> {
}
