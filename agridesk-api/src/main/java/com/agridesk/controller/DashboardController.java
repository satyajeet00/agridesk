package com.agridesk.controller;

import com.agridesk.dto.dashboard.DashboardResponse;
import com.agridesk.service.DashboardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "2. Dashboard", description = "Aggregated metrics for the dealer's landing screen: total outstanding udhari, today's and month's sales, top debtors, recent bills, expiring-soon stock count.")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public DashboardResponse overview() {
        return dashboardService.getOverview();
    }
}
