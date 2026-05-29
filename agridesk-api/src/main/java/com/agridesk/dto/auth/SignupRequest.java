package com.agridesk.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
        @NotBlank String shopName,
        @NotBlank String ownerName,
        @NotBlank String phone,
        @Email String email,
        @NotBlank @Size(min = 6) String password,
        String language
) {}
