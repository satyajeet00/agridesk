package com.agridesk.dto.product;

import com.agridesk.entity.StockBatch;

import java.time.Instant;

public record ExpiringBatchResponse(
        String id,
        String batchNo,
        Instant expiryDate,
        Double quantity,
        String productName
) {
    public static ExpiringBatchResponse from(StockBatch b) {
        return new ExpiringBatchResponse(
                b.getId(), b.getBatchNo(), b.getExpiryDate(),
                b.getQuantity(), b.getProduct().getName()
        );
    }
}
