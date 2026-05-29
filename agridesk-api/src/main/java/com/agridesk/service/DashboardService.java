package com.agridesk.service;

import com.agridesk.dto.bill.BillResponse;
import com.agridesk.dto.dashboard.DashboardResponse;
import com.agridesk.dto.farmer.FarmerResponse;
import com.agridesk.repository.BillRepository;
import com.agridesk.repository.FarmerRepository;
import com.agridesk.repository.StockBatchRepository;
import com.agridesk.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final FarmerRepository farmerRepository;
    private final BillRepository billRepository;
    private final StockBatchRepository stockBatchRepository;

    public DashboardResponse getOverview() {
        String dealerId = CurrentUser.dealerId();
        ZoneId zone = ZoneId.systemDefault();
        Instant startOfDay = LocalDate.now(zone).atStartOfDay(zone).toInstant();
        Instant startOfMonth = LocalDate.now(zone).withDayOfMonth(1).atStartOfDay(zone).toInstant();
        Instant now = Instant.now();
        Instant expiryThreshold = now.plus(30, ChronoUnit.DAYS);

        long totalFarmers = farmerRepository.countByDealer_Id(dealerId);
        Double totalOutstanding = farmerRepository.sumOutstandingByDealer(dealerId);
        Double todaySales = billRepository.sumTotalAmountSince(dealerId, startOfDay);
        Double monthSales = billRepository.sumTotalAmountSince(dealerId, startOfMonth);
        long expiringStock = stockBatchRepository.countExpiring(dealerId, now, expiryThreshold);

        List<FarmerResponse> topDebtors = farmerRepository
                .findTopDebtors(dealerId, PageRequest.of(0, 5))
                .stream().map(FarmerResponse::from).toList();

        List<BillResponse> recentBills = billRepository
                .findTop5ByDealer_IdOrderByCreatedAtDesc(dealerId)
                .stream().map(BillResponse::from).toList();

        return new DashboardResponse(
                totalFarmers,
                totalOutstanding == null ? 0.0 : totalOutstanding,
                todaySales == null ? 0.0 : todaySales,
                monthSales == null ? 0.0 : monthSales,
                expiringStock,
                topDebtors,
                recentBills
        );
    }
}
