package com.example.q34.api;

import java.util.List;

public record ApiInfo(
        String service,
        String status,
        String message,
        List<String> endpoints) {
}
