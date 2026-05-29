package com.agridesk.service;

import com.agridesk.dto.payment.OrderResponse;
import com.agridesk.dto.payment.VerifyRequest;
import com.agridesk.entity.Dealer;
import com.agridesk.repository.DealerRepository;
import com.agridesk.security.CurrentUser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private static final long PRICE_PAISE = 49900L; // Rs 499

    private final DealerRepository dealerRepository;
    private final ObjectMapper objectMapper;

    @Value("${agridesk.razorpay.key-id}")
    private String keyId;

    @Value("${agridesk.razorpay.key-secret}")
    private String keySecret;

    public OrderResponse createOrder() {
        if (keyId == null || keyId.isBlank() || keySecret == null || keySecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "razorpay_not_configured");
        }

        String dealerId = CurrentUser.dealerId();
        String body;
        try {
            Map<String, Object> payload = Map.of(
                    "amount", PRICE_PAISE,
                    "currency", "INR",
                    "receipt", "agridesk_" + dealerId + "_" + System.currentTimeMillis(),
                    "notes", Map.of("dealerId", dealerId)
            );
            body = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "serialization_failed");
        }

        String credentials = Base64.getEncoder()
                .encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));

        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.razorpay.com/v1/orders"))
                    .header("Authorization", "Basic " + credentials)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "razorpay_error: " + response.body());
            }

            JsonNode json = objectMapper.readTree(response.body());
            return new OrderResponse(
                    json.get("id").asText(),
                    json.get("amount").asLong(),
                    json.get("currency").asText(),
                    keyId
            );
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "order_creation_failed");
        }
    }

    @Transactional
    public Map<String, Object> verify(VerifyRequest req) {
        if (keySecret == null || keySecret.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "razorpay_not_configured");
        }

        String payload = req.razorpayOrderId() + "|" + req.razorpayPaymentId();
        String expected = hmacSha256Hex(payload, keySecret);

        if (!expected.equalsIgnoreCase(req.razorpaySignature())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid_signature");
        }

        Dealer dealer = dealerRepository.findById(CurrentUser.dealerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "dealer_not_found"));
        dealer.setPlan("active");
        dealer.setTrialEndsAt(null);
        dealerRepository.save(dealer);

        return Map.of("success", true);
    }

    private static String hmacSha256Hex(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sig = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(sig);
        } catch (Exception e) {
            throw new RuntimeException("hmac_failed", e);
        }
    }
}
