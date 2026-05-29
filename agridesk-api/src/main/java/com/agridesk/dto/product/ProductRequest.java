package com.agridesk.dto.product;

import jakarta.validation.constraints.NotBlank;

public record ProductRequest(
        @NotBlank String name,
        @NotBlank String category,
        String unit,
        String hsnCode,
        Double gstRate
) {}
