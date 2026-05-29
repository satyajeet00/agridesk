package com.agridesk.controller;

import com.agridesk.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SettingsControllerTest extends AbstractIntegrationTest {

    @Test
    void updateDealer_persistsChanges() throws Exception {
        var dealer = helpers.createDealer("OldShop", "supd");

        Map<String, Object> body = new HashMap<>();
        body.put("shopName", "NewShop");
        body.put("phone", "8888888888");
        body.put("email", "new@test.com");
        body.put("address", "123 Street");
        body.put("gstin", "29ABCDE1234F2Z5");
        body.put("language", "en");

        mockMvc.perform(put("/api/settings/dealer")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shopName").value("NewShop"))
                .andExpect(jsonPath("$.phone").value("8888888888"))
                .andExpect(jsonPath("$.language").value("en"));

        mockMvc.perform(get("/api/settings/dealer")
                        .header("Authorization", dealer.bearer()))
                .andExpect(jsonPath("$.shopName").value("NewShop"));
    }

    @Test
    void addStaff_succeeds() throws Exception {
        var dealer = helpers.createDealer("Shop", "sadd");
        Map<String, Object> body = Map.of(
                "name", "Staff1",
                "email", "staff-" + System.nanoTime() + "@test.com",
                "password", "secret123");

        mockMvc.perform(post("/api/settings/staff")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("staff"))
                .andExpect(jsonPath("$.name").value("Staff1"));
    }

    @Test
    void addStaff_duplicateEmail_returns409() throws Exception {
        var dealer = helpers.createDealer("Shop", "sdup");
        String email = "staff-" + System.nanoTime() + "@test.com";
        Map<String, Object> body = Map.of(
                "name", "Staff1", "email", email, "password", "secret123");

        mockMvc.perform(post("/api/settings/staff")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/settings/staff")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("email_already_exists"));
    }

    @Test
    void removeStaff_succeeds() throws Exception {
        var dealer = helpers.createDealer("Shop", "srem");
        Map<String, Object> body = Map.of(
                "name", "Staff1",
                "email", "staff-" + System.nanoTime() + "@test.com",
                "password", "secret123");

        MvcResult res = mockMvc.perform(post("/api/settings/staff")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andReturn();
        String staffId = helpers.tree(res.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(delete("/api/settings/staff/" + staffId)
                        .header("Authorization", dealer.bearer()))
                .andExpect(status().isOk());
    }

    @Test
    void removeOwner_returns400() throws Exception {
        var dealer = helpers.createDealer("Shop", "sown");

        mockMvc.perform(delete("/api/settings/staff/" + dealer.userId())
                        .header("Authorization", dealer.bearer()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("cannot_remove_owner"));
    }

    @Test
    void removeStaff_fromOtherDealer_returns403() throws Exception {
        var dealerA = helpers.createDealer("ShopA", "sxa");
        var dealerB = helpers.createDealer("ShopB", "sxb");

        Map<String, Object> body = Map.of(
                "name", "StaffA",
                "email", "staffA-" + System.nanoTime() + "@test.com",
                "password", "secret123");
        MvcResult res = mockMvc.perform(post("/api/settings/staff")
                        .header("Authorization", dealerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andReturn();
        String staffId = helpers.tree(res.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(delete("/api/settings/staff/" + staffId)
                        .header("Authorization", dealerB.bearer()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("not_allowed"));
    }

    @Test
    void listStaff_returnsOnlyOwnDealerStaff() throws Exception {
        var dealerA = helpers.createDealer("ShopA", "slstA");
        var dealerB = helpers.createDealer("ShopB", "slstB");

        mockMvc.perform(post("/api/settings/staff")
                        .header("Authorization", dealerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of(
                                "name", "StaffA",
                                "email", "staffAlst-" + System.nanoTime() + "@test.com",
                                "password", "secret123"))))
                .andExpect(status().isOk());

        MvcResult res = mockMvc.perform(get("/api/settings/staff")
                        .header("Authorization", dealerB.bearer()))
                .andReturn();
        JsonNode arr = helpers.tree(res.getResponse().getContentAsString());
        // dealer B has only the owner (1 user), not dealer A's staff
        assertThat(arr.size()).isEqualTo(1);
        assertThat(arr.get(0).get("role").asText()).isEqualTo("owner");
    }
}
