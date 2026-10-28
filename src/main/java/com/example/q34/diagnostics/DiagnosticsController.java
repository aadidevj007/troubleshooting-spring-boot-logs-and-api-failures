package com.example.q34.diagnostics;

import com.example.q34.api.ApiKeyGuard;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/diagnostics")
public class DiagnosticsController {

    private final DiagnosticsService service;
    private final ApiKeyGuard apiKeyGuard;

    public DiagnosticsController(DiagnosticsService service, ApiKeyGuard apiKeyGuard) {
        this.service = service;
        this.apiKeyGuard = apiKeyGuard;
    }

    @GetMapping("/status")
    public ApplicationStatus status(@RequestHeader(value = "X-Local-Admin-Key", required = false) String apiKey) {
        apiKeyGuard.requireConfiguredKey(apiKey);
        return service.applicationStatus();
    }

    @GetMapping("/database")
    public DatabaseStatus database(@RequestHeader(value = "X-Local-Admin-Key", required = false) String apiKey) {
        apiKeyGuard.requireConfiguredKey(apiKey);
        return service.databaseStatus();
    }

    @PostMapping("/scenarios")
    public DiagnosticResult scenario(
            @Valid @RequestBody DiagnosticScenarioRequest request,
            @RequestHeader(value = "X-Local-Admin-Key", required = false) String apiKey) {
        apiKeyGuard.requireConfiguredKey(apiKey);
        return service.simulate(request.scenario());
    }
}
