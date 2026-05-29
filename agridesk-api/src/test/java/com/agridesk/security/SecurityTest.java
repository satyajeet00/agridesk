package com.agridesk.security;

import com.agridesk.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SecurityTest extends AbstractIntegrationTest {

    @Test
    void protectedEndpoint_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/farmers"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withTamperedSignature_returns401() throws Exception {
        var dealer = helpers.createDealer("Shop", "secTamp");
        // Flip the last 4 chars of the signature segment to corrupt the HMAC
        String token = dealer.token();
        String tampered = token.substring(0, token.length() - 4) + "AAAA";

        mockMvc.perform(get("/api/farmers")
                        .header("Authorization", "Bearer " + tampered))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpoint_withMalformedToken_returns401() throws Exception {
        mockMvc.perform(get("/api/farmers")
                        .header("Authorization", "Bearer not-a-jwt-at-all"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicEndpoint_signup_isReachableWithoutAuth() throws Exception {
        Map<String, Object> body = Map.of(
                "shopName", "S",
                "ownerName", "O",
                "phone", "1",
                "email", "pub-" + System.nanoTime() + "@test.com",
                "password", "secret123"
        );
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isOk());
    }

    @Test
    void publicEndpoint_login_isReachableWithoutAuth() throws Exception {
        // login with unknown email returns 401 from service, not from security filter
        Map<String, Object> body = Map.of(
                "email", "nobody-" + System.nanoTime() + "@test.com",
                "password", "x"
        );
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("invalid_credentials"));
    }

    @Test
    void corsPreflight_allowedOrigin_succeeds() throws Exception {
        mockMvc.perform(options("/api/farmers")
                        .header("Origin", "http://127.0.0.1:5501")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://127.0.0.1:5501"))
                .andExpect(header().exists("Access-Control-Allow-Methods"));
    }

    @Test
    void corsPreflight_disallowedOrigin_returns403() throws Exception {
        mockMvc.perform(options("/api/farmers")
                        .header("Origin", "http://malicious.example.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
