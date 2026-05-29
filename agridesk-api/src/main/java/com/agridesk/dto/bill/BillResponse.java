package com.agridesk.dto.bill;

import com.agridesk.entity.Bill;

import java.time.Instant;
import java.util.List;

public record BillResponse(
        String id,
        String billNo,
        Double totalAmount,
        Double paidAmount,
        Double creditAmount,
        Double gstAmount,
        String method,
        String status,
        String farmerId,
        String farmerName,
        String farmerPhone,
        List<BillItemResponse> items,
        Instant createdAt
) {
    public static BillResponse from(Bill b) {
        List<BillItemResponse> items = b.getItems() == null
                ? List.of()
                : b.getItems().stream().map(BillItemResponse::from).toList();
        return new BillResponse(
                b.getId(), b.getBillNo(),
                b.getTotalAmount(), b.getPaidAmount(),
                b.getCreditAmount(), b.getGstAmount(),
                b.getMethod(), b.getStatus(),
                b.getFarmer().getId(),
                b.getFarmer().getName(),
                b.getFarmer().getPhone(),
                items,
                b.getCreatedAt()
        );
    }
}
