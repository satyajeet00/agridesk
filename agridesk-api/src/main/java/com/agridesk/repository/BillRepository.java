package com.agridesk.repository;

import com.agridesk.entity.Bill;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, String> {
    List<Bill> findByDealer_IdOrderByCreatedAtDesc(String dealerId);
    Optional<Bill> findByIdAndDealer_Id(String id, String dealerId);
    long countByDealer_Id(String dealerId);

    List<Bill> findTop5ByDealer_IdOrderByCreatedAtDesc(String dealerId);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.dealer.id = :dealerId AND b.createdAt >= :from")
    Double sumTotalAmountSince(@Param("dealerId") String dealerId, @Param("from") Instant from);
}
