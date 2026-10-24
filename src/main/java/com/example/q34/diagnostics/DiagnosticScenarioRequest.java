package com.example.q34.diagnostics;

import jakarta.validation.constraints.NotNull;

public record DiagnosticScenarioRequest(@NotNull DiagnosticScenario scenario) {
}
