package com.agridesk.dto.bill;

import com.agridesk.entity.BillItem;

public record BillItemResponse(
        String id,
        Double quantity,
        Double unitPrice,
        Double total,
        String productId,
        String productName,
        String batchId
) {
    public static BillItemResponse from(BillItem i) {
        return new BillItemResponse(
                i.getId(),
                i.getQuantity(),
                i.getUnitPrice(),
                i.getTotal(),
                i.getProduct().getId(),
                i.getProduct().getName(),
                i.getBatch() == null ? null : i.getBatch().getId()
        );
    }
}
