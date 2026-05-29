package com.agridesk.controller;

import com.agridesk.dto.farmer.FarmerRequest;
import com.agridesk.dto.farmer.FarmerResponse;
import com.agridesk.service.FarmerService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/farmers")
@RequiredArgsConstructor
@Tag(name = "3. Farmers", description = "CRUD for the dealer's farmer customers. Listing is sorted by outstanding balance so debtors surface first.")
public class FarmerController {

    private final FarmerService farmerService;

    @GetMapping
    public List<FarmerResponse> list() {
        return farmerService.list();
    }

    @PostMapping
    public FarmerResponse create(@Valid @RequestBody FarmerRequest req) {
        return farmerService.create(req);
    }

    @PutMapping("/{id}")
    public FarmerResponse update(@PathVariable String id, @Valid @RequestBody FarmerRequest req) {
        return farmerService.update(id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        farmerService.delete(id);
    }
}
