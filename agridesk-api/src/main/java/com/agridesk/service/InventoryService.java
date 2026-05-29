package com.agridesk.service;

import com.agridesk.dto.product.*;
import com.agridesk.entity.Dealer;
import com.agridesk.entity.Product;
import com.agridesk.entity.StockBatch;
import com.agridesk.repository.DealerRepository;
import com.agridesk.repository.ProductRepository;
import com.agridesk.repository.StockBatchRepository;
import com.agridesk.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductRepository productRepository;
    private final StockBatchRepository stockBatchRepository;
    private final DealerRepository dealerRepository;

    public List<ProductResponse> listProducts() {
        return productRepository
                .findByDealer_IdOrderByNameAsc(CurrentUser.dealerId())
                .stream().map(ProductResponse::from).toList();
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest req) {
        Dealer dealer = dealerRepository.findById(CurrentUser.dealerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "dealer_not_found"));

        Product product = Product.builder()
                .name(req.name())
                .category(req.category())
                .unit(req.unit() == null ? "kg" : req.unit())
                .hsnCode(req.hsnCode())
                .gstRate(req.gstRate() == null ? 0.0 : req.gstRate())
                .dealer(dealer)
                .build();
        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(String id) {
        Product product = productRepository.findByIdAndDealer_Id(id, CurrentUser.dealerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "product_not_found"));
        try {
            productRepository.delete(product);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "product_in_use");
        }
    }

    @Transactional
    public StockBatchResponse addStock(StockBatchRequest req) {
        Product product = productRepository.findByIdAndDealer_Id(req.productId(), CurrentUser.dealerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "product_not_found"));

        StockBatch batch = StockBatch.builder()
                .batchNo(req.batchNo())
                .quantity(req.quantity())
                .costPrice(req.costPrice() == null ? 0.0 : req.costPrice())
                .sellingPrice(req.sellingPrice())
                .expiryDate(req.expiryDate())
                .supplierName(req.supplierName())
                .product(product)
                .build();
        return StockBatchResponse.from(stockBatchRepository.save(batch));
    }

    public List<ExpiringBatchResponse> listExpiring() {
        Instant now = Instant.now();
        Instant threshold = now.plus(30, ChronoUnit.DAYS);
        return stockBatchRepository.findExpiring(CurrentUser.dealerId(), now, threshold)
                .stream().map(ExpiringBatchResponse::from).toList();
    }
}
