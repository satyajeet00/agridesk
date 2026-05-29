package com.agridesk.dto.bill;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

public record BillRequest(
        @NotBlank String farmerId,
        @NotEmpty @Valid List<BillItemRequest> items,
        String method,
        @PositiveOrZero Double paidAmount
) {}
