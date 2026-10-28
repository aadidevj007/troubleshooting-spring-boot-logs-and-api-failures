package com.example.q34.diagnostics;

import java.time.Instant;
import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataAccessException;

@Service
public class DiagnosticsService {

    private final JdbcTemplate jdbcTemplate;
    private final String datasourceUrl;

    public DiagnosticsService(DataSource dataSource,
                              @Value("${spring.datasource.url}") String datasourceUrl) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
        this.datasourceUrl = datasourceUrl;
    }

    public DatabaseStatus databaseStatus() {
        String checkedAt = Instant.now().toString();
        try {
            Integer dual = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return new DatabaseStatus(dual != null && dual == 1, hostFromUrl(datasourceUrl),
                    portFromUrl(datasourceUrl), checkedAt, "JDBC SELECT 1 check succeeded",
                    "CONNECTED", "The configured datasource returned 1 from SELECT 1.");
        } catch (DataAccessException exception) {
            return new DatabaseStatus(false, hostFromUrl(datasourceUrl), portFromUrl(datasourceUrl),
                    checkedAt, "JDBC connectivity check unavailable", "UNAVAILABLE",
                    "The configured datasource did not complete SELECT 1; sensitive driver details are omitted.");
        }
    }

    public ApplicationStatus applicationStatus() {
        return new ApplicationStatus("q34-student-api", "UP", Instant.now().toString());
    }

    public DiagnosticResult simulate(DiagnosticScenario scenario) {
        String evidence;
        String probableCause;
        String recommendedFix;
        String classification;
        switch (scenario) {
            case WRONG_HOST -> {
                classification = "DNS_OR_NETWORK";
                evidence = "Simulation only: an application configured with a non-existent database host would fail name resolution.";
                probableCause = "The datasource hostname does not resolve on the Compose network.";
                recommendedFix = "Use the Compose service name mysql and verify network connectivity.";
            }
            case WRONG_PASSWORD -> {
                classification = "AUTHENTICATION";
                evidence = "Simulation only: MySQL would reject credentials that do not match the configured database user.";
                probableCause = "The configured database username and password do not match.";
                recommendedFix = "Align the local .env values with the initialized MySQL user without exposing them.";
            }
            case DB_UNAVAILABLE -> {
                classification = "AVAILABILITY";
                evidence = "Simulation only: requests would fail while MySQL is stopped, starting, or unhealthy.";
                probableCause = "The database service is unavailable or has not passed its health check.";
                recommendedFix = "Run docker compose ps and docker compose logs mysql, then wait for the health check.";
            }
            case API_NOT_FOUND -> {
                classification = "ROUTING";
                evidence = "Simulation only: an unregistered HTTP route would return 404.";
                probableCause = "The requested path is not mapped by the Spring Boot application.";
                recommendedFix = "Confirm the method and path against the local API allowlist.";
            }
            default -> throw new IllegalStateException("Unsupported diagnostic scenario");
        }
        return new DiagnosticResult(scenario, classification, true, evidence, probableCause,
                recommendedFix, Instant.now().toString());
    }

    private String hostFromUrl(String url) {
        String[] parts = url.split("//", 2);
        if (parts.length < 2) return "unknown";
        return parts[1].split(":", 2)[0];
    }

    private int portFromUrl(String url) {
        try {
            String afterHost = url.split("//", 2)[1].split("/", 2)[0];
            return Integer.parseInt(afterHost.split(":", 2)[1]);
        } catch (RuntimeException exception) {
            return 3306;
        }
    }
}
