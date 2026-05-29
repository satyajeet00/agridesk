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

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class FarmerControllerTest extends AbstractIntegrationTest {

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private DealerRepository dealerRepository;

    @Test
    void create_happyPath() throws Exception {
        var dealer = helpers.createDealer("Shop", "fcrud");
        Map<String, Object> body = Map.of(
                "name", "Suresh",
                "phone", "9999900001",
                "village", "Rampur",
                "crops", "wheat"
        );

        mockMvc.perform(post("/api/farmers")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Suresh"))
                .andExpect(jsonPath("$.outstandingBalance").value(0.0))
                .andExpect(jsonPath("$.id").isString());
    }

    @Test
    void create_missingName_returns400() throws Exception {
        var dealer = helpers.createDealer("Shop", "fval");
        Map<String, Object> body = Map.of("name", "", "phone", "9999900001");

        mockMvc.perform(post("/api/farmers")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("validation_failed"));
    }

    @Test
    void list_sortedByBalanceDesc() throws Exception {
        var dealer = helpers.createDealer("Shop", "fsort");
        Dealer d = dealerRepository.findById(dealer.dealerId()).orElseThrow();

        farmerRepository.save(Farmer.builder()
                .name("LowDebtor").phone("1").outstandingBalance(100.0)
                .dealer(d).build());
        farmerRepository.save(Farmer.builder()
                .name("HighDebtor").phone("2").outstandingBalance(5000.0)
                .dealer(d).build());
        farmerRepository.save(Farmer.builder()
                .name("MidDebtor").phone("3").outstandingBalance(1000.0)
                .dealer(d).build());

        MvcResult result = mockMvc.perform(get("/api/farmers")
                        .header("Authorization", dealer.bearer()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode arr = helpers.tree(result.getResponse().getContentAsString());
        assertThat(arr.size()).isEqualTo(3);
        assertThat(arr.get(0).get("name").asText()).isEqualTo("HighDebtor");
        assertThat(arr.get(1).get("name").asText()).isEqualTo("MidDebtor");
        assertThat(arr.get(2).get("name").asText()).isEqualTo("LowDebtor");
    }

    @Test
    void update_persistsChanges() throws Exception {
        var dealer = helpers.createDealer("Shop", "fupd");
        Map<String, Object> create = Map.of("name", "Old", "phone", "1");
        MvcResult created = mockMvc.perform(post("/api/farmers")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(create)))
                .andReturn();
        String id = helpers.tree(created.getResponse().getContentAsString()).get("id").asText();

        Map<String, Object> update = Map.of(
                "name", "New",
                "phone", "2",
                "village", "Newville",
                "crops", "rice");
        mockMvc.perform(put("/api/farmers/" + id)
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New"))
                .andExpect(jsonPath("$.village").value("Newville"));
    }

    @Test
    void delete_removesFarmer() throws Exception {
        var dealer = helpers.createDealer("Shop", "fdel");
        Map<String, Object> create = Map.of("name", "ToDelete", "phone", "1");
        MvcResult created = mockMvc.perform(post("/api/farmers")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(create)))
                .andReturn();
        String id = helpers.tree(created.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(delete("/api/farmers/" + id)
                        .header("Authorization", dealer.bearer()))
                .andExpect(status().isOk());

        MvcResult after = mockMvc.perform(get("/api/farmers")
                        .header("Authorization", dealer.bearer()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode arr = helpers.tree(after.getResponse().getContentAsString());
        assertThat(arr.size()).isEqualTo(0);
    }

    @Test
    void crossDealer_update_returns404() throws Exception {
        var dealerA = helpers.createDealer("ShopA", "fxA");
        var dealerB = helpers.createDealer("ShopB", "fxB");

        MvcResult created = mockMvc.perform(post("/api/farmers")
                        .header("Authorization", dealerA.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("name", "AsFarmer", "phone", "1"))))
                .andReturn();
        String id = helpers.tree(created.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(put("/api/farmers/" + id)
                        .header("Authorization", dealerB.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("name", "Hacked", "phone", "2"))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("farmer_not_found"));
    }
}
