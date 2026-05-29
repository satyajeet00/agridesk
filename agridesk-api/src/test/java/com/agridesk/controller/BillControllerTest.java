package com.agridesk.controller;

import com.agridesk.repository.StockBatchRepository;
import com.agridesk.support.AbstractIntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class BillControllerTest extends AbstractIntegrationTest {

    @Autowired
    private StockBatchRepository stockBatchRepository;

    private record Ctx(com.agridesk.support.TestHelpers.DealerToken dealer,
                       String farmerId, String productId, String batchId,
                       double gstRate) {}

    private Ctx setupCtx(String label, double gstRate) throws Exception {
        var dealer = helpers.createDealer("Shop", label);

        MvcResult fr = mockMvc.perform(post("/api/farmers")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(Map.of("name", "F", "phone", "1"))))
                .andReturn();
        String farmerId = helpers.tree(fr.getResponse().getContentAsString()).get("id").asText();

        Map<String, Object> productBody = new HashMap<>();
        productBody.put("name", "Urea");
        productBody.put("category", "fertilizer");
        productBody.put("gstRate", gstRate);
        MvcResult pr = mockMvc.perform(post("/api/products")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(productBody)))
                .andReturn();
        String productId = helpers.tree(pr.getResponse().getContentAsString()).get("id").asText();

        Map<String, Object> batchBody = new HashMap<>();
        batchBody.put("productId", productId);
        batchBody.put("batchNo", "BATCH-1");
        batchBody.put("quantity", 100.0);
        batchBody.put("costPrice", 50.0);
        batchBody.put("sellingPrice", 1000.0);
        batchBody.put("expiryDate", Instant.now().plus(180, ChronoUnit.DAYS).toString());
        MvcResult br = mockMvc.perform(post("/api/stock")
                        .header("Authorization", dealer.bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(batchBody)))
                .andReturn();
        String batchId = helpers.tree(br.getResponse().getContentAsString()).get("id").asText();

        return new Ctx(dealer, farmerId, productId, batchId, gstRate);
    }

    private double getFarmerBalance(Ctx ctx) throws Exception {
        MvcResult res = mockMvc.perform(get("/api/farmers")
                        .header("Authorization", ctx.dealer().bearer()))
                .andReturn();
        JsonNode arr = helpers.tree(res.getResponse().getContentAsString());
        for (JsonNode f : arr) {
            if (f.get("id").asText().equals(ctx.farmerId())) {
                return f.get("outstandingBalance").asDouble();
            }
        }
        return -1;
    }

    @Test
    void create_billWithGstMath_andCreditEntry() throws Exception {
        Ctx ctx = setupCtx("bgst", 5.0);

        Map<String, Object> body = Map.of(
                "farmerId", ctx.farmerId(),
                "method", "cash",
                "paidAmount", 0.0,
                "items", List.of(Map.of(
                        "productId", ctx.productId(),
                        "batchId", ctx.batchId(),
                        "quantity", 2.0,
                        "unitPrice", 1000.0
                ))
        );

        MvcResult res = mockMvc.perform(post("/api/bills")
                        .header("Authorization", ctx.dealer().bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.billNo").value("B-0001"))
                .andExpect(jsonPath("$.totalAmount").value(2100.0))
                .andExpect(jsonPath("$.gstAmount").value(100.0))
                .andExpect(jsonPath("$.paidAmount").value(0.0))
                .andExpect(jsonPath("$.creditAmount").value(2100.0))
                .andExpect(jsonPath("$.status").value("partial"))
                .andReturn();

        JsonNode bill = helpers.tree(res.getResponse().getContentAsString());
        assertThat(bill.get("items").size()).isEqualTo(1);

        // farmer balance += creditAmount
        assertThat(getFarmerBalance(ctx)).isEqualTo(2100.0);

        // stock batch decremented from 100 to 98
        var batch = stockBatchRepository.findById(ctx.batchId()).orElseThrow();
        assertThat(batch.getQuantity()).isEqualTo(98.0);
    }

    @Test
    void create_billPaidInFull_noCreditEntry_status_paid() throws Exception {
        Ctx ctx = setupCtx("bpaid", 0.0);

        Map<String, Object> body = Map.of(
                "farmerId", ctx.farmerId(),
                "method", "cash",
                "paidAmount", 1000.0,
                "items", List.of(Map.of(
                        "productId", ctx.productId(),
                        "quantity", 1.0,
                        "unitPrice", 1000.0
                ))
        );

        mockMvc.perform(post("/api/bills")
                        .header("Authorization", ctx.dealer().bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAmount").value(1000.0))
                .andExpect(jsonPath("$.paidAmount").value(1000.0))
                .andExpect(jsonPath("$.creditAmount").value(0.0))
                .andExpect(jsonPath("$.status").value("paid"));

        assertThat(getFarmerBalance(ctx)).isEqualTo(0.0);
    }

    @Test
    void billNumbering_isPerDealerAndSequential() throws Exception {
        Ctx ctxA = setupCtx("bnA", 0.0);
        Ctx ctxB = setupCtx("bnB", 0.0);

        Map<String, Object> billA1 = Map.of(
                "farmerId", ctxA.farmerId(), "method", "cash", "paidAmount", 0.0,
                "items", List.of(Map.of("productId", ctxA.productId(), "quantity", 1.0, "unitPrice", 100.0)));
        Map<String, Object> billA2 = billA1;
        Map<String, Object> billB1 = Map.of(
                "farmerId", ctxB.farmerId(), "method", "cash", "paidAmount", 0.0,
                "items", List.of(Map.of("productId", ctxB.productId(), "quantity", 1.0, "unitPrice", 50.0)));

        mockMvc.perform(post("/api/bills")
                        .header("Authorization", ctxA.dealer().bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(billA1)))
                .andExpect(jsonPath("$.billNo").value("B-0001"));

        mockMvc.perform(post("/api/bills")
                        .header("Authorization", ctxA.dealer().bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(billA2)))
                .andExpect(jsonPath("$.billNo").value("B-0002"));

        mockMvc.perform(post("/api/bills")
                        .header("Authorization", ctxB.dealer().bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(billB1)))
                .andExpect(jsonPath("$.billNo").value("B-0001"));
    }

    @Test
    void delete_reversesFarmerBalance() throws Exception {
        Ctx ctx = setupCtx("bdel", 0.0);

        Map<String, Object> body = Map.of(
                "farmerId", ctx.farmerId(), "method", "cash", "paidAmount", 0.0,
                "items", List.of(Map.of("productId", ctx.productId(), "quantity", 1.0, "unitPrice", 500.0)));

        MvcResult res = mockMvc.perform(post("/api/bills")
                        .header("Authorization", ctx.dealer().bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andReturn();
        String billId = helpers.tree(res.getResponse().getContentAsString()).get("id").asText();

        assertThat(getFarmerBalance(ctx)).isEqualTo(500.0);

        mockMvc.perform(delete("/api/bills/" + billId)
                        .header("Authorization", ctx.dealer().bearer()))
                .andExpect(status().isOk());

        assertThat(getFarmerBalance(ctx)).isEqualTo(0.0);
    }

    @Test
    void create_crossDealerFarmer_returns404() throws Exception {
        Ctx ctxA = setupCtx("bxa", 0.0);
        Ctx ctxB = setupCtx("bxb", 0.0);

        // Use dealer B's token but dealer A's farmer
        Map<String, Object> body = Map.of(
                "farmerId", ctxA.farmerId(),
                "method", "cash",
                "paidAmount", 0.0,
                "items", List.of(Map.of("productId", ctxB.productId(), "quantity", 1.0, "unitPrice", 100.0)));

        mockMvc.perform(post("/api/bills")
                        .header("Authorization", ctxB.dealer().bearer())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(helpers.toJson(body)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("farmer_not_found"));
    }
}
