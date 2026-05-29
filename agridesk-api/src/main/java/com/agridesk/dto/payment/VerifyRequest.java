package com.agridesk.dto.payment;

import jakarta.validation.constraints.NotBlank;

public record VerifyRequest(
        @NotBlank String razorpayOrderId,
        @NotBlank String razorpayPaymentId,
        @NotBlank String razorpaySignature
) {}
