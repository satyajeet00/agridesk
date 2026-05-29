package com.agridesk.dto.payment;

public record OrderResponse(
        String orderId,
        long amount,
        String currency,
        String keyId
) {}
