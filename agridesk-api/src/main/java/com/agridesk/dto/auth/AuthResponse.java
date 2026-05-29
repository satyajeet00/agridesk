package com.agridesk.dto.auth;

public record AuthResponse(
        String token,
        String userId,
        String email,
        String name,
        String role,
        String dealerId,
        String shopName,
        String language
) {}
