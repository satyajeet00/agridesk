package com.agridesk.controller;

import com.agridesk.dto.payment.OrderResponse;
import com.agridesk.dto.payment.VerifyRequest;
import com.agridesk.service.PaymentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Tag(name = "8. Payment (Razorpay)", description = "Razorpay order creation and HMAC-SHA256 signature verification for the ₹499/month subscription. Returns 503 when Razorpay keys are unconfigured (dev mode).")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    public OrderResponse createOrder() {
        return paymentService.createOrder();
    }

    @PostMapping("/verify")
    public Map<String, Object> verify(@Valid @RequestBody VerifyRequest req) {
        return paymentService.verify(req);
    }
}
