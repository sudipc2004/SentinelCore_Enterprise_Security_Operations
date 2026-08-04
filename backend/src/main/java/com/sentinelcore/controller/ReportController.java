package com.sentinelcore.controller;

import com.sentinelcore.model.ReportRecord;
import com.sentinelcore.security.UserPrincipal;
import com.sentinelcore.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping
    public ResponseEntity<List<ReportRecord>> getReports() {
        return ResponseEntity.ok(reportService.getReports());
    }

    @PostMapping("/generate")
    public ResponseEntity<ReportRecord> generateReport(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(reportService.generateReport(request, userPrincipal.getUsername()));
    }
}
