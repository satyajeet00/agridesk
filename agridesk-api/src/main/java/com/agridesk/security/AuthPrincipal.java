package com.agridesk.security;

public record AuthPrincipal(String userId, String email, String dealerId, String role) {
}
