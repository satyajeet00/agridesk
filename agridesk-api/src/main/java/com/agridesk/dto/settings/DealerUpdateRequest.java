package com.agridesk.dto.settings;

import jakarta.validation.constraints.NotBlank;

public record DealerUpdateRequest(
        @NotBlank String shopName,
        String phone,
        String email,
        String address,
        String gstin,
        String language
) {}
