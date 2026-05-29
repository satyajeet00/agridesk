package com.agridesk.dto.ledger;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record LedgerEntryRequest(
        @NotBlank String farmerId,
        @Positive Double amount,
        String note
) {}
