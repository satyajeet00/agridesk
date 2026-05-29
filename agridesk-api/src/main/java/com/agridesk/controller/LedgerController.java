package com.agridesk.controller;

import com.agridesk.dto.ledger.LedgerEntryRequest;
import com.agridesk.dto.ledger.LedgerEntryResponse;
import com.agridesk.service.LedgerService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/ledger")
@RequiredArgsConstructor
@Tag(name = "6. Ledger (Udhari)", description = "Per-farmer credit and payment entries. Every credit increases the farmer's outstandingBalance, every payment decreases it. Deleting an entry reverses its effect.")
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping
    public List<LedgerEntryResponse> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        return ledgerService.list(from, to);
    }

    @PostMapping("/credit")
    public LedgerEntryResponse addCredit(@Valid @RequestBody LedgerEntryRequest req) {
        return ledgerService.addCredit(req);
    }

    @PostMapping("/payment")
    public LedgerEntryResponse addPayment(@Valid @RequestBody LedgerEntryRequest req) {
        return ledgerService.addPayment(req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        ledgerService.delete(id);
    }
}
