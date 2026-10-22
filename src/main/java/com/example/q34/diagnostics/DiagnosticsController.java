package com.example.q34.diagnostics;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/diagnostics")
public class DiagnosticsController {

    private final DiagnosticsService service;

    public DiagnosticsController(DiagnosticsService service) {
        this.service = service;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return service.applicationStatus();
    }

    @GetMapping("/database")
    public Map<String, Object> database() {
        return service.databaseStatus();
    }
}
