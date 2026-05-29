package com.agridesk.dto.dashboard;

import com.agridesk.dto.bill.BillResponse;
import com.agridesk.dto.farmer.FarmerResponse;

import java.util.List;

public record DashboardResponse(
        long totalFarmers,
        Double totalOutstanding,
        Double todaySales,
        Double monthSales,
        long expiringStock,
        List<FarmerResponse> topDebtors,
        List<BillResponse> recentBills
) {}
