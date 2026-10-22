package com.example.q34.diagnostics;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DiagnosticsService {

    private final JdbcTemplate jdbcTemplate;
    private final String datasourceUrl;

    public DiagnosticsService(DataSource dataSource,
                              @Value("${spring.datasource.url}") String datasourceUrl) {
        this.jdbcTemplate = new JdbcTemplate(dataSource);
        this.datasourceUrl = datasourceUrl;
    }

    public Map<String, Object> databaseStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("checkedAt", Instant.now().toString());
        result.put("host", hostFromUrl(datasourceUrl));
        result.put("port", portFromUrl(datasourceUrl));
        try {
            Integer dual = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            result.put("connected", dual != null && dual == 1);
            result.put("message", "JDBC connectivity check succeeded");
        } catch (Exception exception) {
            result.put("connected", false);
            result.put("message", "JDBC connectivity check failed: " + exception.getClass().getSimpleName());
        }
        return result;
    }

    public Map<String, Object> applicationStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("service", "q34-student-api");
        result.put("status", "UP");
        result.put("checkedAt", Instant.now().toString());
        return result;
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
