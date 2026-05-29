package com.agridesk.dto.farmer;

import jakarta.validation.constraints.NotBlank;

public record FarmerRequest(
        @NotBlank String name,
        @NotBlank String phone,
        String village,
        String crops
) {}
