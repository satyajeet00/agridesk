package com.agridesk.controller;

import com.agridesk.dto.settings.*;
import com.agridesk.service.SettingsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Tag(name = "7. Settings", description = "Dealer profile (shop name, GSTIN, language) and staff management. Owners are immortal — they cannot remove themselves.")
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping("/dealer")
    public DealerResponse getDealer() {
        return settingsService.getDealer();
    }

    @PutMapping("/dealer")
    public DealerResponse updateDealer(@Valid @RequestBody DealerUpdateRequest req) {
        return settingsService.updateDealer(req);
    }

    @GetMapping("/staff")
    public List<StaffResponse> listStaff() {
        return settingsService.listStaff();
    }

    @PostMapping("/staff")
    public StaffResponse addStaff(@Valid @RequestBody StaffRequest req) {
        return settingsService.addStaff(req);
    }

    @DeleteMapping("/staff/{id}")
    public void removeStaff(@PathVariable String id) {
        settingsService.removeStaff(id);
    }
}
