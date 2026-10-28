package com.example.q34.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class ApiKeyGuard {

    private final String configuredKey;

    public ApiKeyGuard(@Value("${app.security.api-key:}") String configuredKey) {
        this.configuredKey = configuredKey;
    }

    public void requireConfiguredKey(String suppliedKey) {
        if (!configuredKey.isBlank() && !configuredKey.equals(suppliedKey)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
    }
}
