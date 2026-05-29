package com.agridesk.dto.product;

import com.agridesk.entity.StockBatch;

import java.time.Instant;

public record StockBatchResponse(
        String id,
        String batchNo,
        Double quantity,
        Double costPrice,
        Double sellingPrice,
        Instant expiryDate,
        String supplierName
) {
    public static StockBatchResponse from(StockBatch b) {
        return new StockBatchResponse(
                b.getId(), b.getBatchNo(), b.getQuantity(),
                b.getCostPrice(), b.getSellingPrice(),
                b.getExpiryDate(), b.getSupplierName()
        );
    }
}
