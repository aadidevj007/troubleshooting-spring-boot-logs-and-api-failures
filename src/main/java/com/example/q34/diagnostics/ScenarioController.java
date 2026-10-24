package com.example.q34.diagnostics;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/diagnostics/scenarios")
public class ScenarioController {
    private static final Set<String> ALLOWED = Set.of("wrong-host", "bad-password", "db-not-ready", "healthy");

    @GetMapping
    public Map<String, Object> simulate(@RequestParam(defaultValue = "healthy") String scenario) {
        if (!ALLOWED.contains(scenario)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported scenario");
        }
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("scenario", scenario);
        response.put("simulated", true);
        response.put("checkedAt", Instant.now().toString());
        switch (scenario) {
            case "wrong-host" -> {
                response.put("category", "DNS_RESOLUTION");
                response.put("expectedError", "UnknownHostException / Communications link failure");
                response.put("rootCause", "JDBC hostname does not resolve on the Compose network.");
                response.put("recommendedAction", "Use the Compose service name mysql in SPRING_DATASOURCE_URL; inspect app logs and network.");
            }
            case "bad-password" -> {
                response.put("category", "AUTHENTICATION");
                response.put("expectedError", "Access denied for user");
                response.put("rootCause", "Spring datasource credentials do not match the initialized MySQL account.");
                response.put("recommendedAction", "Check environment variable mapping; do not print credentials. Existing volumes retain old MySQL users.");
            }
            case "db-not-ready" -> {
                response.put("category", "READINESS");
                response.put("expectedError", "Connection refused / connection timeout");
                response.put("rootCause", "Database is not accepting connections yet.");
                response.put("recommendedAction", "Inspect docker compose ps and MySQL healthcheck; wait for healthy before starting app.");
            }
            default -> {
                response.put("category", "HEALTHY");
                response.put("expectedError", "None");
                response.put("rootCause", "No failure is simulated.");
                response.put("recommendedAction", "Run /api/diagnostics/database to check actual JDBC connectivity.");
            }
        }
        return response;
    }
}
