package com.agridesk.controller;

import com.agridesk.dto.product.*;
import com.agridesk.service.InventoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "4. Inventory", description = "Products and stock batches. Each product can have many stock batches with their own quantity, prices, and expiry. /stock/expiring returns batches expiring in the next 30 days.")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/products")
    public List<ProductResponse> listProducts() {
        return inventoryService.listProducts();
    }

    @PostMapping("/products")
    public ProductResponse createProduct(@Valid @RequestBody ProductRequest req) {
        return inventoryService.createProduct(req);
    }

    @DeleteMapping("/products/{id}")
    public void deleteProduct(@PathVariable String id) {
        inventoryService.deleteProduct(id);
    }

    @PostMapping("/stock")
    public StockBatchResponse addStock(@Valid @RequestBody StockBatchRequest req) {
        return inventoryService.addStock(req);
    }

    @GetMapping("/stock/expiring")
    public List<ExpiringBatchResponse> listExpiring() {
        return inventoryService.listExpiring();
    }
}
