package com.example.q34.api;

import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class DiagnosticRateLimitFilter extends OncePerRequestFilter {

    private final int maxRequests;
    private final long windowSeconds;
    private final Clock clock = Clock.systemUTC();
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public DiagnosticRateLimitFilter(
            @Value("${app.rate-limit.diagnostics.max-requests:30}") int maxRequests,
            @Value("${app.rate-limit.diagnostics.window-seconds:60}") long windowSeconds) {
        this.maxRequests = maxRequests;
        this.windowSeconds = windowSeconds;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/diagnostics");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String key = request.getRemoteAddr();
        long now = Instant.now(clock).getEpochSecond();
        Window window = windows.compute(key, (ignored, current) -> {
            if (current == null || now - current.startedAt >= windowSeconds) {
                return new Window(now, new AtomicInteger(1));
            }
            current.count.incrementAndGet();
            return current;
        });
        if (window.count.get() > maxRequests) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"Diagnostic rate limit exceeded\"}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private record Window(long startedAt, AtomicInteger count) {
    }
}
