package com.example.q34.diagnostics;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;

import com.example.q34.api.ApiExceptionHandler;
import com.example.q34.api.ApiKeyGuard;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.beans.factory.annotation.Autowired;

@WebMvcTest(DiagnosticsController.class)
@Import(ApiExceptionHandler.class)
class DiagnosticsControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private DiagnosticsService service;

    @MockBean
    private ApiKeyGuard apiKeyGuard;

    @Test
    void acceptsKnownScenarioAndReturnsSimulation() throws Exception {
        when(service.simulate(DiagnosticScenario.WRONG_HOST)).thenReturn(new DiagnosticResult(
                DiagnosticScenario.WRONG_HOST, "DNS_OR_NETWORK", true, "Simulation only",
                "Hostname does not resolve", "Use mysql", Instant.now().toString()));

        mvc.perform(post("/api/diagnostics/scenarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scenario\":\"WRONG_HOST\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scenario").value("WRONG_HOST"))
                .andExpect(jsonPath("$.simulated").value(true));
    }

    @Test
    void rejectsUnknownScenarioWithoutCallingService() throws Exception {
        mvc.perform(post("/api/diagnostics/scenarios")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scenario\":\"CONNECT_TO_HOST\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Request body is invalid or contains an unsupported value"));
    }
}
