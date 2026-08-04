package com.sentinelcore.controller;

import com.sentinelcore.service.RiskScoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/risk")
public class RiskController {

    @Autowired
    private RiskScoringService riskScoringService;

    @GetMapping("/summary")
    public ResponseEntity<?> getRiskSummary() {
        return ResponseEntity.ok(riskScoringService.getRiskSummary());
    }

    @GetMapping("/assets")
    public ResponseEntity<?> getAssetRiskScores() {
        return ResponseEntity.ok(riskScoringService.getAssetRiskScores());
    }
}
