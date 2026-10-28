package com.example.q34.diagnostics;

public record DiagnosticResult(
        DiagnosticScenario scenario,
        String classification,
        boolean simulated,
        String evidence,
        String probableCause,
        String recommendedFix,
        String timestamp) {
}
