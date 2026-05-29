package com.agridesk.dto.product;

import com.agridesk.entity.Product;

import java.util.List;

public record ProductResponse(
        String id,
        String name,
        String category,
        String unit,
        String hsnCode,
        Double gstRate,
        List<StockBatchResponse> stockBatches
) {
    public static ProductResponse from(Product p) {
        List<StockBatchResponse> batches = p.getStockBatches() == null
                ? List.of()
                : p.getStockBatches().stream().map(StockBatchResponse::from).toList();
        return new ProductResponse(
                p.getId(), p.getName(), p.getCategory(),
                p.getUnit(), p.getHsnCode(), p.getGstRate(),
                batches
        );
    }
}
