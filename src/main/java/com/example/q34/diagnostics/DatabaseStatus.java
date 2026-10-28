package com.example.q34.diagnostics;

public record DatabaseStatus(
        boolean connected,
        String host,
        int port,
        String checkedAt,
        String message,
        String classification,
        String evidence) {
}
