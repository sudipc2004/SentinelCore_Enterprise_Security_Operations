package com.sentinelcore.controller;

import com.sentinelcore.model.Log;
import com.sentinelcore.repository.LogRepository;
import com.sentinelcore.service.AuditLogService;
import com.sentinelcore.service.ThreatDetectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/logs")
public class LogController {

    @Autowired
    private LogRepository logRepository;

    @Autowired
    private ThreatDetectionService threatDetectionService;

    @Autowired
    private AuditLogService auditLogService;

    @PostMapping
    public ResponseEntity<?> ingestLog(@RequestBody Log log, @AuthenticationPrincipal com.sentinelcore.model.User principal) {
        String email = principal != null ? principal.getEmail() : "anonymous@sentinelcore.in";
        Log processed = threatDetectionService.processLog(log);
        auditLogService.log(email, "LOG_INGEST", "LOGS", "127.0.0.1", "Ingested single log ID: " + processed.getId());
        return ResponseEntity.ok(processed);
    }

    @GetMapping
    public ResponseEntity<?> getAllLogs(@RequestParam(required = false) String systemType,
                                        @RequestParam(required = false) Boolean isAnomaly,
                                        @RequestParam(required = false) String search) {
        List<Log> logs = logRepository.findAll();
        List<Log> filtered = new ArrayList<>();

        for (Log log : logs) {
            boolean matches = true;
            if (systemType != null && !systemType.equalsIgnoreCase(log.getSystemType())) {
                matches = false;
            }
            if (isAnomaly != null && log.isAnomaly() != isAnomaly) {
                matches = false;
            }
            if (search != null && search.trim().length() > 0) {
                String q = search.toLowerCase();
                boolean searchMatch = false;
                if (log.getRawMessage() != null && log.getRawMessage().toLowerCase().contains(q)) searchMatch = true;
                if (log.getIpAddress() != null && log.getIpAddress().toLowerCase().contains(q)) searchMatch = true;
                if (log.getUserEmail() != null && log.getUserEmail().toLowerCase().contains(q)) searchMatch = true;
                if (log.getDevice() != null && log.getDevice().toLowerCase().contains(q)) searchMatch = true;
                if (!searchMatch) {
                    matches = false;
                }
            }
            if (matches) {
                filtered.add(log);
            }
        }

        // Sort descending by timestamp (newest logs first)
        filtered.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));

        return ResponseEntity.ok(filtered);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getLogById(@PathVariable String id) {
        Optional<Log> logOpt = logRepository.findById(id);
        if (logOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(logOpt.get());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLog(@PathVariable String id, @AuthenticationPrincipal com.sentinelcore.model.User principal) {
        String email = principal != null ? principal.getEmail() : "anonymous@sentinelcore.in";
        if (logRepository.existsById(id)) {
            logRepository.deleteById(id);
            auditLogService.log(email, "LOG_DELETE", "LOGS", "127.0.0.1", "Deleted log ID: " + id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadLogFile(@RequestParam("file") MultipartFile file,
                                           @RequestParam("systemType") String systemType,
                                           @AuthenticationPrincipal com.sentinelcore.model.User principal) {
        String email = principal != null ? principal.getEmail() : "anonymous@sentinelcore.in";
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));
        }

        List<Log> processedLogs = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            // Regex to extract IP addresses, ports, and email addresses if available in the raw line
            Pattern ipPattern = Pattern.compile("(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})");
            Pattern portPattern = Pattern.compile("port\\s*(\\d+)");
            Pattern emailPattern = Pattern.compile("([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6})");

            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;

                Log log = new Log();
                log.setSystemType(systemType.toUpperCase());
                log.setRawMessage(line.substring(0, Math.min(line.length(), 2000)));
                log.setTimestamp(Instant.now());

                // Parsers
                Matcher ipMatcher = ipPattern.matcher(line);
                if (ipMatcher.find()) {
                    log.setIpAddress(ipMatcher.group(1));
                } else {
                    log.setIpAddress("127.0.0.1");
                }

                Matcher portMatcher = portPattern.matcher(line);
                if (portMatcher.find()) {
                    log.setPort(Integer.parseInt(portMatcher.group(1)));
                } else {
                    log.setPort(80);
                }

                Matcher emailMatcher = emailPattern.matcher(line);
                if (emailMatcher.find()) {
                    log.setUserEmail(emailMatcher.group(1));
                } else {
                    log.setUserEmail("system-logger@sentinelcore.in");
                }

                // Default protocols / counts
                log.setProtocol("TCP");
                log.setBytes((long) (Math.random() * 5000));
                log.setDevice(systemType.toLowerCase() + "-node");
                log.setCountry("India");

                if (line.toLowerCase().contains("failed login") || line.toLowerCase().contains("unauthorized")) {
                    log.setFailedLoginCount(5);
                    log.setRequestFrequency(12);
                } else if (line.toLowerCase().contains("port scan") || line.toLowerCase().contains("nmap")) {
                    log.setFailedLoginCount(0);
                    log.setRequestFrequency(180);
                } else {
                    log.setFailedLoginCount(0);
                    log.setRequestFrequency(1);
                }

                Log processed = threatDetectionService.processLog(log);
                processedLogs.add(processed);
            }

            auditLogService.log(email, "LOG_BULK_UPLOAD", "LOGS", "127.0.0.1", "Uploaded log file " + file.getOriginalFilename() + ", processed " + processedLogs.size() + " records");
            return ResponseEntity.ok(Map.of(
                    "message", "Successfully processed " + processedLogs.size() + " logs",
                    "processedCount", processedLogs.size()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error parsing log file: " + e.getMessage()));
        }
    }
}
