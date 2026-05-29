package com.agridesk.dto.ledger;

import com.agridesk.entity.CreditEntry;

import java.time.Instant;

public record LedgerEntryResponse(
        String id,
        String type,
        Double amount,
        String note,
        String billId,
        String farmerId,
        String farmerName,
        String farmerPhone,
        Instant date
) {
    public static LedgerEntryResponse from(CreditEntry e) {
        return new LedgerEntryResponse(
                e.getId(),
                e.getType(),
                e.getAmount(),
                e.getNote(),
                e.getBillId(),
                e.getFarmer().getId(),
                e.getFarmer().getName(),
                e.getFarmer().getPhone(),
                e.getDate()
        );
    }
}
