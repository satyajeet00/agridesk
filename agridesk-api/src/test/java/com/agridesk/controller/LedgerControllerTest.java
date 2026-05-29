package com.agridesk.controller;

import com.agridesk.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class LedgerControllerTest extends AbstractIntegrationTest {

    private String createFarmer(String authHeader) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/farmers")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("name", "F", "phone", "1"))))
                .andReturn();
        return helpers.tree(res.getResponse().getContentAsString()).get("id").asText();
    }

    private double getBalance(String farmerId, String authHeader) throws Exception {
        MvcResult res = mockMvc.perform(get("/api/farmers")
                        .header("Authorization", authHeader))
                .andReturn();
        JsonNode arr = helpers.tree(res.getResponse().getContentAsString());
        for (JsonNode f : arr) {
            if (f.get("id").asText().equals(farmerId)) {
                return f.get("outstandingBalance").asDouble();
            }
        }
        throw new RuntimeException("Farmer not found: " + farmerId);
    }

    @Test
    void credit_increasesBalance() throws Exception {
        var dealer = helpers.createDealer("Shop", "lcred");
        String farmerId = createFarmer(dealer.bearer());

        mockMvc.perform(post("/api/ledger/credit")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("farmerId", farmerId, "amount", 500.0, "note", "seed"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("credit"))
                .andExpect(jsonPath("$.amount").value(500.0));

        assertThat(getBalance(farmerId, dealer.bearer())).isEqualTo(500.0);
    }

    @Test
    void payment_decreasesBalance() throws Exception {
        var dealer = helpers.createDealer("Shop", "lpay");
        String farmerId = createFarmer(dealer.bearer());

        mockMvc.perform(post("/api/ledger/credit")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("farmerId", farmerId, "amount", 500.0))))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/ledger/payment")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("farmerId", farmerId, "amount", 200.0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("payment"));

        assertThat(getBalance(farmerId, dealer.bearer())).isEqualTo(300.0);
    }

    @Test
    void deleteCredit_reversesBalance() throws Exception {
        var dealer = helpers.createDealer("Shop", "lrev");
        String farmerId = createFarmer(dealer.bearer());

        MvcResult created = mockMvc.perform(post("/api/ledger/credit")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("farmerId", farmerId, "amount", 700.0))))
                .andReturn();
        String entryId = helpers.tree(created.getResponse().getContentAsString()).get("id").asText();

        assertThat(getBalance(farmerId, dealer.bearer())).isEqualTo(700.0);

        mockMvc.perform(delete("/api/ledger/" + entryId)
                        .header("Authorization", dealer.bearer()))
                .andExpect(status().isOk());

        assertThat(getBalance(farmerId, dealer.bearer())).isEqualTo(0.0);
    }

    @Test
    void deletePayment_reversesBalance() throws Exception {
        var dealer = helpers.createDealer("Shop", "lrevp");
        String farmerId = createFarmer(dealer.bearer());

        mockMvc.perform(post("/api/ledger/credit")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("farmerId", farmerId, "amount", 1000.0))))
                .andExpect(status().isOk());

        MvcResult pay = mockMvc.perform(post("/api/ledger/payment")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("farmerId", farmerId, "amount", 300.0))))
                .andReturn();
        String payId = helpers.tree(pay.getResponse().getContentAsString()).get("id").asText();

        assertThat(getBalance(farmerId, dealer.bearer())).isEqualTo(700.0);

        mockMvc.perform(delete("/api/ledger/" + payId)
                        .header("Authorization", dealer.bearer()))
                .andExpect(status().isOk());

        assertThat(getBalance(farmerId, dealer.bearer())).isEqualTo(1000.0);
    }

    @Test
    void list_dateFilter_returnsOnlyInRange() throws Exception {
        var dealer = helpers.createDealer("Shop", "ldate");
        String farmerId = createFarmer(dealer.bearer());

        mockMvc.perform(post("/api/ledger/credit")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("farmerId", farmerId, "amount", 100.0))))
                .andExpect(status().isOk());

        Instant future = Instant.now().plus(1, ChronoUnit.DAYS);

        MvcResult res = mockMvc.perform(get("/api/ledger")
                        .header("Authorization", dealer.bearer())
                        .param("from", future.toString()))
                .andReturn();
        JsonNode arr = helpers.tree(res.getResponse().getContentAsString());
        assertThat(arr.size()).isEqualTo(0);

        MvcResult res2 = mockMvc.perform(get("/api/ledger")
                        .header("Authorization", dealer.bearer()))
                .andReturn();
        JsonNode arr2 = helpers.tree(res2.getResponse().getContentAsString());
        assertThat(arr2.size()).isEqualTo(1);
    }

    @Test
    void credit_crossDealerFarmer_returns404() throws Exception {
        var dealerA = helpers.createDealer("ShopA", "lxa");
        var dealerB = helpers.createDealer("ShopB", "lxb");
        String farmerA = createFarmer(dealerA.bearer());

        mockMvc.perform(post("/api/ledger/credit")
                        .header("Authorization", dealerB.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("farmerId", farmerA, "amount", 100.0))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("farmer_not_found"));
    }
}
