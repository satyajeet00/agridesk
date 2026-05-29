package com.agridesk.dto.bill;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record BillItemRequest(
        @NotBlank String productId,
        String batchId,
        @Positive Double quantity,
        @Positive Double unitPrice
) {}
