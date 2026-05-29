package com.agridesk.service;

import com.agridesk.dto.farmer.FarmerRequest;
import com.agridesk.dto.farmer.FarmerResponse;
import com.agridesk.entity.Dealer;
import com.agridesk.entity.Farmer;
import com.agridesk.repository.DealerRepository;
import com.agridesk.repository.FarmerRepository;
import com.agridesk.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FarmerService {

    private final FarmerRepository farmerRepository;
    private final DealerRepository dealerRepository;

    public List<FarmerResponse> list() {
        return farmerRepository
                .findByDealer_IdOrderByOutstandingBalanceDesc(CurrentUser.dealerId())
                .stream().map(FarmerResponse::from).toList();
    }

    @Transactional
    public FarmerResponse create(FarmerRequest req) {
        Dealer dealer = dealerRepository.findById(CurrentUser.dealerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "dealer_not_found"));

        Farmer farmer = Farmer.builder()
                .name(req.name())
                .phone(req.phone())
                .village(req.village())
                .crops(req.crops())
                .outstandingBalance(0.0)
                .dealer(dealer)
                .build();
        return FarmerResponse.from(farmerRepository.save(farmer));
    }

    @Transactional
    public FarmerResponse update(String id, FarmerRequest req) {
        Farmer farmer = farmerRepository.findByIdAndDealer_Id(id, CurrentUser.dealerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "farmer_not_found"));
        farmer.setName(req.name());
        farmer.setPhone(req.phone());
        farmer.setVillage(req.village());
        farmer.setCrops(req.crops());
        return FarmerResponse.from(farmerRepository.save(farmer));
    }

    @Transactional
    public void delete(String id) {
        Farmer farmer = farmerRepository.findByIdAndDealer_Id(id, CurrentUser.dealerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "farmer_not_found"));
        farmerRepository.delete(farmer);
    }
}
