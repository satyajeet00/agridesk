package com.agridesk.controller;

import com.agridesk.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest extends AbstractIntegrationTest {

    @Test
    void signup_happyPath_returnsTokenAndCreatesDealer() throws Exception {
        Map<String, Object> body = Map.of(
                "shopName", "Krishi Kendra",
                "ownerName", "Ram Singh",
                "phone", "9876543210",
                "email", "ram-" + System.nanoTime() + "@test.com",
                "password", "secret123",
                "language", "hi"
        );

        MvcResult result = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.userId").isString())
                .andExpect(jsonPath("$.dealerId").isString())
                .andExpect(jsonPath("$.shopName").value("Krishi Kendra"))
                .andExpect(jsonPath("$.role").value("owner"))
                .andExpect(jsonPath("$.language").value("hi"))
                .andReturn();

        JsonNode json = helpers.tree(result.getResponse().getContentAsString());
        assertThat(json.get("token").asText()).isNotBlank();
    }

    @Test
    void signup_duplicateEmail_returns409() throws Exception {
        String email = "dup-" + System.nanoTime() + "@test.com";
        Map<String, Object> body = Map.of(
                "shopName", "Shop1",
                "ownerName", "Owner1",
                "phone", "9876543210",
                "email", email,
                "password", "secret123"
        );

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("email_already_exists"));
    }

    @Test
    void signup_weakPassword_returns400() throws Exception {
        Map<String, Object> body = Map.of(
                "shopName", "Shop",
                "ownerName", "Owner",
                "phone", "9876543210",
                "email", "weak-" + System.nanoTime() + "@test.com",
                "password", "12345"
        );

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("validation_failed"))
                .andExpect(jsonPath("$.fields.password").isString());
    }

    @Test
    void signup_invalidEmail_returns400() throws Exception {
        Map<String, Object> body = Map.of(
                "shopName", "Shop",
                "ownerName", "Owner",
                "phone", "9876543210",
                "email", "not-an-email",
                "password", "secret123"
        );

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("validation_failed"));
    }

    @Test
    void login_correctCredentials_returnsToken() throws Exception {
        String email = "login-" + System.nanoTime() + "@test.com";
        Map<String, Object> signup = Map.of(
                "shopName", "Login Shop",
                "ownerName", "Owner",
                "phone", "9876543210",
                "email", email,
                "password", "secret123"
        );
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(helpers.toJson(signup))).andExpect(status().isOk());

        Map<String, Object> login = Map.of("email", email, "password", "secret123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        String email = "wrongpw-" + System.nanoTime() + "@test.com";
        Map<String, Object> signup = Map.of(
                "shopName", "Shop",
                "ownerName", "Owner",
                "phone", "9876543210",
                "email", email,
                "password", "secret123"
        );
        mockMvc.perform(post("/api/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(helpers.toJson(signup))).andExpect(status().isOk());

        Map<String, Object> login = Map.of("email", email, "password", "wrongpassword");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(login)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("invalid_credentials"));
    }

    @Test
    void login_unknownEmail_returns401() throws Exception {
        Map<String, Object> login = Map.of(
                "email", "nobody-" + System.nanoTime() + "@test.com",
                "password", "secret123"
        );
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(login)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("invalid_credentials"));
    }

    @Test
    void me_withValidToken_returnsClaims() throws Exception {
        var dealer = helpers.createDealer("MyShop", "me-owner");
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", dealer.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(dealer.userId()))
                .andExpect(jsonPath("$.dealerId").value(dealer.dealerId()))
                .andExpect(jsonPath("$.email").value(dealer.email()))
                .andExpect(jsonPath("$.role").value("owner"));
    }

    @Test
    void me_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }
}
