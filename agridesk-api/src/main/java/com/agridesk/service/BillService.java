package com.agridesk.service;

import com.agridesk.dto.bill.BillItemRequest;
import com.agridesk.dto.bill.BillRequest;
import com.agridesk.dto.bill.BillResponse;
import com.agridesk.entity.*;
import com.agridesk.repository.*;
import com.agridesk.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepository billRepository;
    private final FarmerRepository farmerRepository;
    private final DealerRepository dealerRepository;
    private final ProductRepository productRepository;
    private final StockBatchRepository stockBatchRepository;
    private final CreditEntryRepository creditEntryRepository;

    public List<BillResponse> list() {
        return billRepository.findByDealer_IdOrderByCreatedAtDesc(CurrentUser.dealerId())
                .stream().map(BillResponse::from).toList();
    }

    @Transactional
    public BillResponse create(BillRequest req) {
        String dealerId = CurrentUser.dealerId();

        Dealer dealer = dealerRepository.findById(dealerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "dealer_not_found"));
        Farmer farmer = farmerRepository.findByIdAndDealer_Id(req.farmerId(), dealerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "farmer_not_found"));

        // Calculate totals & GST
        double subtotal = 0.0;
        double gstTotal = 0.0;
        for (BillItemRequest item : req.items()) {
            Product p = productRepository.findByIdAndDealer_Id(item.productId(), dealerId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "product_not_found"));
            double lineTotal = item.quantity() * item.unitPrice();
            subtotal += lineTotal;
            if (p.getGstRate() != null && p.getGstRate() > 0) {
                gstTotal += lineTotal * p.getGstRate() / 100.0;
            }
        }
        double totalAmount = subtotal + gstTotal;
        double paidAmount = req.paidAmount() == null ? 0.0 : req.paidAmount();
        double creditAmount = Math.max(0.0, totalAmount - paidAmount);

        // Generate bill number
        long count = billRepository.countByDealer_Id(dealerId);
        String billNo = String.format("B-%04d", count + 1);

        Bill bill = Bill.builder()
                .billNo(billNo)
                .totalAmount(totalAmount)
                .paidAmount(paidAmount)
                .creditAmount(creditAmount)
                .gstAmount(gstTotal)
                .method(req.method() == null ? "cash" : req.method())
                .status(creditAmount > 0 ? "partial" : "paid")
                .farmer(farmer)
                .dealer(dealer)
                .items(new ArrayList<>())
                .build();
        bill = billRepository.save(bill);

        // Add bill items, deduct stock
        for (BillItemRequest itemReq : req.items()) {
            Product product = productRepository.findByIdAndDealer_Id(itemReq.productId(), dealerId).get();
            StockBatch batch = null;
            if (itemReq.batchId() != null && !itemReq.batchId().isBlank()) {
                batch = stockBatchRepository.findByIdAndProduct_Dealer_Id(itemReq.batchId(), dealerId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "batch_not_found"));
                batch.setQuantity(batch.getQuantity() - itemReq.quantity());
                stockBatchRepository.save(batch);
            }
            double lineTotal = itemReq.quantity() * itemReq.unitPrice();
            BillItem billItem = BillItem.builder()
                    .quantity(itemReq.quantity())
                    .unitPrice(itemReq.unitPrice())
                    .total(lineTotal)
                    .bill(bill)
                    .product(product)
                    .batch(batch)
                    .build();
            bill.getItems().add(billItem);
        }
        bill = billRepository.save(bill);

        // Add credit entry and update farmer balance if applicable
        if (creditAmount > 0) {
            CreditEntry creditEntry = CreditEntry.builder()
                    .type("credit")
                    .amount(creditAmount)
                    .note("Bill #" + billNo)
                    .billId(bill.getId())
                    .farmer(farmer)
                    .build();
            creditEntryRepository.save(creditEntry);
            farmer.setOutstandingBalance(farmer.getOutstandingBalance() + creditAmount);
            farmerRepository.save(farmer);
        }

        return BillResponse.from(bill);
    }

    @Transactional
    public void delete(String id) {
        Bill bill = billRepository.findByIdAndDealer_Id(id, CurrentUser.dealerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "bill_not_found"));

        // Reverse credit on farmer
        if (bill.getCreditAmount() != null && bill.getCreditAmount() > 0) {
            Farmer farmer = bill.getFarmer();
            farmer.setOutstandingBalance(farmer.getOutstandingBalance() - bill.getCreditAmount());
            farmerRepository.save(farmer);
        }
        billRepository.delete(bill);
    }
}
