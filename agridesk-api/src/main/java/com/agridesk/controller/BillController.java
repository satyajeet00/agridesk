package com.agridesk.controller;

import com.agridesk.dto.bill.BillRequest;
import com.agridesk.dto.bill.BillResponse;
import com.agridesk.service.BillService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
@RequiredArgsConstructor
@Tag(name = "5. Bills", description = "Bill creation, listing, and deletion. POST runs in a single transaction: deducts stock, computes GST, debits the farmer's balance if partially or fully on credit, and assigns a per-dealer sequential bill number.")
public class BillController {

    private final BillService billService;

    @GetMapping
    public List<BillResponse> list() {
        return billService.list();
    }

    @PostMapping
    public BillResponse create(@Valid @RequestBody BillRequest req) {
        return billService.create(req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        billService.delete(id);
    }
}
