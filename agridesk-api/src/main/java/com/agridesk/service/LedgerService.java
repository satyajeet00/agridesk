package com.agridesk.service;

import com.agridesk.dto.ledger.LedgerEntryRequest;
import com.agridesk.dto.ledger.LedgerEntryResponse;
import com.agridesk.entity.CreditEntry;
import com.agridesk.entity.Farmer;
import com.agridesk.repository.CreditEntryRepository;
import com.agridesk.repository.FarmerRepository;
import com.agridesk.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LedgerService {

    private final CreditEntryRepository creditEntryRepository;
    private final FarmerRepository farmerRepository;

    // Far-future sentinel used in lieu of null upper bound. Picked well past any
    // realistic agri-input business horizon so it functions as "no upper limit".
    private static final Instant FAR_FUTURE = Instant.parse("9999-12-31T23:59:59Z");

    public List<LedgerEntryResponse> list(Instant from, Instant to) {
        Instant lo = (from != null) ? from : Instant.EPOCH;
        Instant hi = (to != null) ? to : FAR_FUTURE;
        return creditEntryRepository.findByDealer(CurrentUser.dealerId(), lo, hi)
                .stream().map(LedgerEntryResponse::from).toList();
    }

    @Transactional
    public LedgerEntryResponse addCredit(LedgerEntryRequest req) {
        return addEntry(req, "credit");
    }

    @Transactional
    public LedgerEntryResponse addPayment(LedgerEntryRequest req) {
        return addEntry(req, "payment");
    }

    private LedgerEntryResponse addEntry(LedgerEntryRequest req, String type) {
        Farmer farmer = farmerRepository.findByIdAndDealer_Id(req.farmerId(), CurrentUser.dealerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "farmer_not_found"));

        CreditEntry entry = CreditEntry.builder()
                .type(type)
                .amount(req.amount())
                .note(req.note())
                .farmer(farmer)
                .date(Instant.now())
                .build();
        entry = creditEntryRepository.save(entry);

        double delta = "credit".equals(type) ? req.amount() : -req.amount();
        farmer.setOutstandingBalance(farmer.getOutstandingBalance() + delta);
        farmerRepository.save(farmer);

        return LedgerEntryResponse.from(entry);
    }

    @Transactional
    public void delete(String id) {
        CreditEntry entry = creditEntryRepository.findByIdAndFarmer_Dealer_Id(id, CurrentUser.dealerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "entry_not_found"));

        // Reverse the balance effect when deleting
        Farmer farmer = entry.getFarmer();
        double delta = "credit".equals(entry.getType()) ? -entry.getAmount() : entry.getAmount();
        farmer.setOutstandingBalance(farmer.getOutstandingBalance() + delta);
        farmerRepository.save(farmer);

        creditEntryRepository.delete(entry);
    }
}
