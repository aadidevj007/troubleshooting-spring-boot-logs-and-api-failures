package com.example.q34.api;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ApiInfoController {

    @GetMapping("/")
    public ApiInfo info() {
        return new ApiInfo(
                "q34-student-api",
                "UP",
                "Spring Boot API is running. Use the documented routes below.",
                List.of(
                        "GET /actuator/health",
                        "GET /api/students",
                        "GET /api/students/{id}",
                        "POST /api/students",
                        "GET /api/diagnostics/database",
                        "POST /api/diagnostics/scenarios"));
    }
}
