package com.agridesk.controller;

import com.agridesk.repository.DealerRepository;
import com.agridesk.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests for /api/payment/verify with Razorpay keys CONFIGURED via @TestPropertySource.
 * Uses a separate ApplicationContext so signature math actually works.
 */
@TestPropertySource(properties = {
        "agridesk.razorpay.key-id=rzp_test_key",
        "agridesk.razorpay.key-secret=test-razorpay-secret"
})
class PaymentVerifyTest extends AbstractIntegrationTest {

    private static final String SECRET = "test-razorpay-secret";

    @Autowired
    private DealerRepository dealerRepository;

    @Test
    void verify_withBadSignature_returns400() throws Exception {
        var dealer = helpers.createDealer("Shop", "pverbad");

        Map<String, Object> body = Map.of(
                "razorpayOrderId", "order_ABC",
                "razorpayPaymentId", "pay_XYZ",
                "razorpaySignature", "deadbeef"
        );

        mockMvc.perform(post("/api/payment/verify")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("invalid_signature"));
    }

    @Test
    void verify_withValidSignature_activatesSubscription() throws Exception {
        var dealer = helpers.createDealer("Shop", "pverok");

        String orderId = "order_ABC";
        String paymentId = "pay_XYZ";
        String signature = hmacSha256Hex(orderId + "|" + paymentId, SECRET);

        Map<String, Object> body = Map.of(
                "razorpayOrderId", orderId,
                "razorpayPaymentId", paymentId,
                "razorpaySignature", signature
        );

        mockMvc.perform(post("/api/payment/verify")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        var d = dealerRepository.findById(dealer.dealerId()).orElseThrow();
        assertThat(d.getPlan()).isEqualTo("active");
        assertThat(d.getTrialEndsAt()).isNull();
    }

    private static String hmacSha256Hex(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] sig = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(sig);
    }
}
