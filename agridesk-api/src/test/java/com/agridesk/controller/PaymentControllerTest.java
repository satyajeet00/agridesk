package com.agridesk.controller;

import com.agridesk.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests for /api/payment with Razorpay keys NOT configured (the default test profile).
 * Verifies createOrder returns 503 when not configured.
 */
class PaymentControllerTest extends AbstractIntegrationTest {

    @Test
    void createOrder_returns503_whenRazorpayNotConfigured() throws Exception {
        var dealer = helpers.createDealer("Shop", "pay503");

        mockMvc.perform(post("/api/payment/create-order")
                        .header("Authorization", dealer.bearer()))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("razorpay_not_configured"));
    }

    @Test
    void verify_withoutAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/payment/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of(
                                "razorpayOrderId", "o",
                                "razorpayPaymentId", "p",
                                "razorpaySignature", "s"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void verify_returns503_whenRazorpayNotConfigured() throws Exception {
        var dealer = helpers.createDealer("Shop", "pay503v");

        mockMvc.perform(post("/api/payment/verify")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of(
                                "razorpayOrderId", "o",
                                "razorpayPaymentId", "p",
                                "razorpaySignature", "s"))))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("razorpay_not_configured"));
    }
}
