package com.agridesk.controller;

import com.agridesk.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class MultiTenantIsolationTest extends AbstractIntegrationTest {

    @Test
    void dealerA_farmer_invisible_to_dealerB() throws Exception {
        var dealerA = helpers.createDealer("ShopA", "isoA1");
        var dealerB = helpers.createDealer("ShopB", "isoB1");

        mockMvc.perform(post("/api/farmers")
                        .header("Authorization", dealerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("name", "SecretFarmer", "phone", "1"))))
                .andExpect(status().isOk());

        MvcResult res = mockMvc.perform(get("/api/farmers")
                        .header("Authorization", dealerB.bearer()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode arr = helpers.tree(res.getResponse().getContentAsString());
        assertThat(arr.size()).isEqualTo(0);
    }

    @Test
    void dealerA_product_invisible_to_dealerB() throws Exception {
        var dealerA = helpers.createDealer("ShopA", "isoA2");
        var dealerB = helpers.createDealer("ShopB", "isoB2");

        mockMvc.perform(post("/api/products")
                        .header("Authorization", dealerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of(
                                "name", "SecretProd",
                                "category", "fertilizer",
                                "gstRate", 0.0))))
                .andExpect(status().isOk());

        MvcResult res = mockMvc.perform(get("/api/products")
                        .header("Authorization", dealerB.bearer()))
                .andReturn();
        JsonNode arr = helpers.tree(res.getResponse().getContentAsString());
        assertThat(arr.size()).isEqualTo(0);
    }

    @Test
    void dealerB_cannot_delete_dealerA_farmer() throws Exception {
        var dealerA = helpers.createDealer("ShopA", "isoA3");
        var dealerB = helpers.createDealer("ShopB", "isoB3");

        MvcResult fr = mockMvc.perform(post("/api/farmers")
                        .header("Authorization", dealerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("name", "Locked", "phone", "1"))))
                .andReturn();
        String farmerId = helpers.tree(fr.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(delete("/api/farmers/" + farmerId)
                        .header("Authorization", dealerB.bearer()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("farmer_not_found"));

        MvcResult after = mockMvc.perform(get("/api/farmers")
                        .header("Authorization", dealerA.bearer()))
                .andReturn();
        assertThat(helpers.tree(after.getResponse().getContentAsString()).size()).isEqualTo(1);
    }

    @Test
    void dealerB_cannot_delete_dealerA_bill() throws Exception {
        var dealerA = helpers.createDealer("ShopA", "isoA4");
        var dealerB = helpers.createDealer("ShopB", "isoB4");

        MvcResult fr = mockMvc.perform(post("/api/farmers")
                        .header("Authorization", dealerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("name", "F", "phone", "1"))))
                .andReturn();
        String farmerId = helpers.tree(fr.getResponse().getContentAsString()).get("id").asText();

        MvcResult pr = mockMvc.perform(post("/api/products")
                        .header("Authorization", dealerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("name", "P", "category", "f", "gstRate", 0.0))))
                .andReturn();
        String productId = helpers.tree(pr.getResponse().getContentAsString()).get("id").asText();

        MvcResult br = mockMvc.perform(post("/api/bills")
                        .header("Authorization", dealerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of(
                                "farmerId", farmerId,
                                "method", "cash",
                                "paidAmount", 0.0,
                                "items", List.of(Map.of("productId", productId, "quantity", 1.0, "unitPrice", 100.0))))))
                .andReturn();
        String billId = helpers.tree(br.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(delete("/api/bills/" + billId)
                        .header("Authorization", dealerB.bearer()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("bill_not_found"));
    }

    @Test
    void dashboard_isPerDealer() throws Exception {
        var dealerA = helpers.createDealer("ShopA", "isoA5");
        var dealerB = helpers.createDealer("ShopB", "isoB5");

        mockMvc.perform(post("/api/farmers")
                        .header("Authorization", dealerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("name", "F", "phone", "1"))))
                .andExpect(status().isOk());

        MvcResult dashB = mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", dealerB.bearer()))
                .andReturn();
        JsonNode d = helpers.tree(dashB.getResponse().getContentAsString());
        assertThat(d.get("totalFarmers").asLong()).isEqualTo(0);
    }
}
