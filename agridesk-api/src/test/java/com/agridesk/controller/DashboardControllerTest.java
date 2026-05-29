package com.agridesk.controller;

import com.agridesk.entity.Dealer;
import com.agridesk.entity.Farmer;
import com.agridesk.repository.DealerRepository;
import com.agridesk.repository.FarmerRepository;
import com.agridesk.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class DashboardControllerTest extends AbstractIntegrationTest {

    @Autowired
    private FarmerRepository farmerRepository;
    @Autowired
    private DealerRepository dealerRepository;

    @Test
    void emptyDealer_returnsZeros() throws Exception {
        var dealer = helpers.createDealer("Shop", "demp");

        mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", dealer.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalFarmers").value(0))
                .andExpect(jsonPath("$.totalOutstanding").value(0.0))
                .andExpect(jsonPath("$.todaySales").value(0.0))
                .andExpect(jsonPath("$.monthSales").value(0.0))
                .andExpect(jsonPath("$.expiringStock").value(0))
                .andExpect(jsonPath("$.topDebtors").isArray())
                .andExpect(jsonPath("$.topDebtors", org.hamcrest.Matchers.hasSize(0)))
                .andExpect(jsonPath("$.recentBills", org.hamcrest.Matchers.hasSize(0)));
    }

    @Test
    void afterOneBill_reflectsSalesAndOutstanding() throws Exception {
        var dealer = helpers.createDealer("Shop", "done");

        MvcResult fr = mockMvc.perform(post("/api/farmers")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("name", "F1", "phone", "1"))))
                .andReturn();
        String farmerId = helpers.tree(fr.getResponse().getContentAsString()).get("id").asText();

        Map<String, Object> productBody = new HashMap<>();
        productBody.put("name", "Urea");
        productBody.put("category", "fertilizer");
        productBody.put("gstRate", 0.0);
        MvcResult pr = mockMvc.perform(post("/api/products")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(productBody)))
                .andReturn();
        String productId = helpers.tree(pr.getResponse().getContentAsString()).get("id").asText();

        Map<String, Object> bill = Map.of(
                "farmerId", farmerId, "method", "cash", "paidAmount", 0.0,
                "items", List.of(Map.of("productId", productId, "quantity", 2.0, "unitPrice", 500.0)));
        mockMvc.perform(post("/api/bills")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(bill)))
                .andExpect(status().isOk());

        MvcResult dash = mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", dealer.bearer()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode d = helpers.tree(dash.getResponse().getContentAsString());
        assertThat(d.get("totalFarmers").asLong()).isEqualTo(1);
        assertThat(d.get("todaySales").asDouble()).isEqualTo(1000.0);
        assertThat(d.get("monthSales").asDouble()).isEqualTo(1000.0);
        assertThat(d.get("totalOutstanding").asDouble()).isEqualTo(1000.0);
        assertThat(d.get("recentBills").size()).isEqualTo(1);
        assertThat(d.get("topDebtors").size()).isEqualTo(1);
    }

    @Test
    void topDebtors_limitedToFive() throws Exception {
        var dealer = helpers.createDealer("Shop", "dtop");
        Dealer d = dealerRepository.findById(dealer.dealerId()).orElseThrow();

        for (int i = 0; i < 7; i++) {
            farmerRepository.save(Farmer.builder()
                    .name("F" + i).phone("p" + i)
                    .outstandingBalance(100.0 + i)
                    .dealer(d).build());
        }

        MvcResult res = mockMvc.perform(get("/api/dashboard")
                        .header("Authorization", dealer.bearer()))
                .andReturn();
        JsonNode body = helpers.tree(res.getResponse().getContentAsString());
        assertThat(body.get("topDebtors").size()).isEqualTo(5);
        // first one should be the highest balance
        assertThat(body.get("topDebtors").get(0).get("outstandingBalance").asDouble())
                .isEqualTo(106.0);
    }
}
