package com.agridesk.dto.settings;

import com.agridesk.entity.User;

import java.time.Instant;

public record StaffResponse(
        String id,
        String name,
        String email,
        String role,
        Instant createdAt
) {
    public static StaffResponse from(User u) {
        return new StaffResponse(u.getId(), u.getName(), u.getEmail(), u.getRole(), u.getCreatedAt());
    }
}
