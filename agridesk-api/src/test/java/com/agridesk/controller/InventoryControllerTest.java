package com.agridesk.controller;

import com.agridesk.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class InventoryControllerTest extends AbstractIntegrationTest {

    private String createProduct(String authHeader, double gstRate) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Urea");
        body.put("category", "fertilizer");
        body.put("unit", "kg");
        body.put("hsnCode", "31021000");
        body.put("gstRate", gstRate);
        MvcResult res = mockMvc.perform(post("/api/products")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andReturn();
        return helpers.tree(res.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void createProduct_persistsAllFields() throws Exception {
        var dealer = helpers.createDealer("Shop", "pcrud");

        mockMvc.perform(post("/api/products")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of(
                                "name", "DAP",
                                "category", "fertilizer",
                                "unit", "kg",
                                "hsnCode", "31051000",
                                "gstRate", 5.0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("DAP"))
                .andExpect(jsonPath("$.category").value("fertilizer"))
                .andExpect(jsonPath("$.hsnCode").value("31051000"))
                .andExpect(jsonPath("$.gstRate").value(5.0));
    }

    @Test
    void addStock_persistsBatch() throws Exception {
        var dealer = helpers.createDealer("Shop", "pstock");
        String productId = createProduct(dealer.bearer(), 5.0);

        Instant expiry = Instant.now().plus(180, ChronoUnit.DAYS);
        Map<String, Object> body = new HashMap<>();
        body.put("productId", productId);
        body.put("batchNo", "BATCH-A");
        body.put("quantity", 100.0);
        body.put("costPrice", 50.0);
        body.put("sellingPrice", 70.0);
        body.put("expiryDate", expiry.toString());
        body.put("supplierName", "ACME");

        mockMvc.perform(post("/api/stock")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchNo").value("BATCH-A"))
                .andExpect(jsonPath("$.quantity").value(100.0))
                .andExpect(jsonPath("$.sellingPrice").value(70.0));
    }

    @Test
    void expiring_includesBatchWithin30Days_excludesOthers() throws Exception {
        var dealer = helpers.createDealer("Shop", "pexp");
        String productId = createProduct(dealer.bearer(), 0.0);

        addBatch(dealer.bearer(), productId, "SOON", 10.0, Instant.now().plus(10, ChronoUnit.DAYS));
        addBatch(dealer.bearer(), productId, "LATER", 10.0, Instant.now().plus(60, ChronoUnit.DAYS));
        addBatch(dealer.bearer(), productId, "EMPTY", 0.0, Instant.now().plus(5, ChronoUnit.DAYS));

        MvcResult res = mockMvc.perform(get("/api/stock/expiring")
                        .header("Authorization", dealer.bearer()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode arr = helpers.tree(res.getResponse().getContentAsString());
        assertThat(arr.size()).isEqualTo(1);
        assertThat(arr.get(0).get("batchNo").asText()).isEqualTo("SOON");
    }

    @Test
    void deleteProduct_notInBills_succeeds() throws Exception {
        var dealer = helpers.createDealer("Shop", "pdel");
        String productId = createProduct(dealer.bearer(), 0.0);

        mockMvc.perform(delete("/api/products/" + productId)
                        .header("Authorization", dealer.bearer()))
                .andExpect(status().isOk());

        MvcResult res = mockMvc.perform(get("/api/products")
                        .header("Authorization", dealer.bearer()))
                .andReturn();
        JsonNode arr = helpers.tree(res.getResponse().getContentAsString());
        assertThat(arr.size()).isEqualTo(0);
    }

    @Test
    void crossDealer_addStock_returns404() throws Exception {
        var dealerA = helpers.createDealer("ShopA", "pxa");
        var dealerB = helpers.createDealer("ShopB", "pxb");
        String productA = createProduct(dealerA.bearer(), 0.0);

        Map<String, Object> body = Map.of(
                "productId", productA,
                "quantity", 10.0,
                "costPrice", 1.0,
                "sellingPrice", 2.0);
        mockMvc.perform(post("/api/stock")
                        .header("Authorization", dealerB.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("product_not_found"));
    }

    private void addBatch(String authHeader, String productId, String batchNo, double qty, Instant expiry) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("productId", productId);
        body.put("batchNo", batchNo);
        body.put("quantity", qty == 0.0 ? 0.001 : qty);
        body.put("costPrice", 10.0);
        body.put("sellingPrice", 20.0);
        body.put("expiryDate", expiry.toString());

        // We can't post a 0-qty via @Positive validation, so we hack via a workaround:
        if (qty == 0.0) {
            addBatchDirect(authHeader, productId, batchNo, expiry);
            return;
        }

        mockMvc.perform(post("/api/stock")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isOk());
    }

    private void addBatchDirect(String authHeader, String productId, String batchNo, Instant expiry) throws Exception {
        // Create batch with qty 1, then in the test layer we directly set its quantity to 0 via the repo.
        Map<String, Object> body = new HashMap<>();
        body.put("productId", productId);
        body.put("batchNo", batchNo);
        body.put("quantity", 1.0);
        body.put("costPrice", 10.0);
        body.put("sellingPrice", 20.0);
        body.put("expiryDate", expiry.toString());

        MvcResult res = mockMvc.perform(post("/api/stock")
                        .header("Authorization", authHeader)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isOk())
                .andReturn();

        String id = helpers.tree(res.getResponse().getContentAsString()).get("id").asText();
        // Set qty to 0 directly to verify the expiring query excludes zero-qty batches
        stockBatchRepository.findById(id).ifPresent(b -> {
            b.setQuantity(0.0);
            stockBatchRepository.save(b);
        });
    }

    @org.springframework.beans.factory.annotation.Autowired
    private com.agridesk.repository.StockBatchRepository stockBatchRepository;
}
