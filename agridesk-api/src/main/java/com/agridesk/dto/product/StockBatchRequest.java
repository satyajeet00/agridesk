package com.agridesk.dto.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.Instant;

public record StockBatchRequest(
        @NotBlank String productId,
        String batchNo,
        @Positive Double quantity,
        @PositiveOrZero Double costPrice,
        @Positive Double sellingPrice,
        Instant expiryDate,
        String supplierName
) {}
