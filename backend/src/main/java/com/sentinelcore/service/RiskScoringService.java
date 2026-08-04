package com.sentinelcore.service;

import com.sentinelcore.model.Asset;
import com.sentinelcore.model.Incident;
import com.sentinelcore.model.Vulnerability;
import com.sentinelcore.repository.AssetRepository;
import com.sentinelcore.repository.IncidentRepository;
import com.sentinelcore.repository.VulnerabilityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class RiskScoringService {

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private VulnerabilityRepository vulnerabilityRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private ComplianceService complianceService;

    public Map<String, Object> getRiskSummary() {
        List<Map<String, Object>> assetRisks = getAssetRiskScores();
        int avgAssetRisk = assetRisks.isEmpty() ? 0 : (int) Math.round(assetRisks.stream()
                .mapToInt(item -> (Integer) item.get("riskScore"))
                .average()
                .orElse(0));
        int compliancePenalty = compliancePenalty();
        int orgRiskScore = clamp((int) Math.round(avgAssetRisk * 0.75 + compliancePenalty * 0.25));
        long criticalAssetsAtRisk = assetRisks.stream()
                .filter(item -> "CRITICAL".equals(item.get("criticality")) && (Integer) item.get("riskScore") >= 60)
                .count();

        return Map.of(
                "riskScore", orgRiskScore,
                "orgRiskScore", orgRiskScore,
                "avgAssetRisk", avgAssetRisk,
                "criticalAssetsAtRisk", criticalAssetsAtRisk,
                "riskTrend", 0,
                "complianceOpenGaps", complianceService.getOpenGapCount(),
                "complianceScore", complianceService.getOverallScore(),
                "topAssets", assetRisks.stream()
                        .sorted(Comparator.comparing(item -> (Integer) item.get("riskScore"), Comparator.reverseOrder()))
                        .limit(5)
                        .collect(Collectors.toList())
        );
    }

    public List<Map<String, Object>> getAssetRiskScores() {
        List<Vulnerability> vulnerabilities = vulnerabilityRepository.findAll();
        List<Incident> incidents = incidentRepository.findAll();
        int compliancePenalty = compliancePenalty();

        return assetRepository.findAll().stream()
                .map(asset -> scoreAsset(asset, vulnerabilities, incidents, compliancePenalty))
                .collect(Collectors.toList());
    }

    public int getAssetRiskScore(Asset asset) {
        return (Integer) scoreAsset(asset, vulnerabilityRepository.findAll(), incidentRepository.findAll(), compliancePenalty()).get("riskScore");
    }

    private Map<String, Object> scoreAsset(Asset asset, List<Vulnerability> vulnerabilities, List<Incident> incidents, int compliancePenalty) {
        List<Vulnerability> assetVulnerabilities = vulnerabilities.stream()
                .filter(vulnerability -> asset.getId() != null && asset.getId().equals(vulnerability.getAssetId()))
                .filter(vulnerability -> !"RESOLVED".equals(vulnerability.getStatus()) && !"CLOSED".equals(vulnerability.getStatus()))
                .collect(Collectors.toList());
        List<Incident> assetIncidents = incidents.stream()
                .filter(incident -> isOpenIncident(incident.getStatus()))
                .filter(incident -> incidentMentionsAsset(incident, asset))
                .collect(Collectors.toList());

        int criticalityScore = criticalityScore(asset.getCriticality());
        int vulnerabilityScore = Math.min(40, assetVulnerabilities.stream().mapToInt(this::vulnerabilityWeight).sum());
        int incidentScore = Math.min(25, assetIncidents.stream().mapToInt(this::incidentWeight).sum());
        int score = clamp(criticalityScore + vulnerabilityScore + incidentScore + compliancePenalty);

        return Map.of(
                "assetId", asset.getId(),
                "assetName", defaultValue(asset.getName(), "Unnamed asset"),
                "ipAddress", defaultValue(asset.getIpAddress(), ""),
                "criticality", defaultValue(asset.getCriticality(), "MEDIUM").toUpperCase(Locale.ROOT),
                "riskScore", score,
                "openVulnerabilities", assetVulnerabilities.size(),
                "openIncidents", assetIncidents.size(),
                "compliancePenalty", compliancePenalty
        );
    }

    private int vulnerabilityWeight(Vulnerability vulnerability) {
        String severity = defaultValue(vulnerability.getSeverity(), "MEDIUM").toUpperCase(Locale.ROOT);
        if ("CRITICAL".equals(severity)) return 30;
        if ("HIGH".equals(severity)) return 18;
        if ("MEDIUM".equals(severity)) return 9;
        if ("LOW".equals(severity)) return 4;
        return 1;
    }

    private int incidentWeight(Incident incident) {
        String priority = defaultValue(incident.getPriority(), "P3").toUpperCase(Locale.ROOT);
        if ("P1".equals(priority)) return 18;
        if ("P2".equals(priority)) return 12;
        if ("P3".equals(priority)) return 7;
        return 4;
    }

    private int criticalityScore(String criticality) {
        String normalized = defaultValue(criticality, "MEDIUM").toUpperCase(Locale.ROOT);
        if ("CRITICAL".equals(normalized)) return 60;
        if ("HIGH".equals(normalized)) return 48;
        if ("MEDIUM".equals(normalized)) return 32;
        return 18;
    }

    private int compliancePenalty() {
        return Math.min(10, complianceService.getOpenGapCount());
    }

    private boolean isOpenIncident(String status) {
        String normalized = defaultValue(status, "OPEN").toUpperCase(Locale.ROOT);
        return !"RESOLVED".equals(normalized) && !"CLOSED".equals(normalized);
    }

    private boolean incidentMentionsAsset(Incident incident, Asset asset) {
        String haystack = (defaultValue(incident.getTitle(), "") + " " + defaultValue(incident.getDescription(), "")).toLowerCase(Locale.ROOT);
        return (StringUtils.hasText(asset.getName()) && haystack.contains(asset.getName().toLowerCase(Locale.ROOT)))
                || (StringUtils.hasText(asset.getIpAddress()) && haystack.contains(asset.getIpAddress().toLowerCase(Locale.ROOT)));
    }

    private int clamp(int score) {
        return Math.max(0, Math.min(100, score));
    }

    private String defaultValue(String value, String fallback) {
        return StringUtils.hasText(value) ? value : fallback;
    }
}
