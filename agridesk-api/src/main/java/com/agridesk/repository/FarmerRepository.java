package com.agridesk.repository;

import com.agridesk.entity.Farmer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FarmerRepository extends JpaRepository<Farmer, String> {
    List<Farmer> findByDealer_IdOrderByOutstandingBalanceDesc(String dealerId);
    Optional<Farmer> findByIdAndDealer_Id(String id, String dealerId);
    long countByDealer_Id(String dealerId);

    @Query("SELECT COALESCE(SUM(f.outstandingBalance), 0) FROM Farmer f WHERE f.dealer.id = :dealerId")
    Double sumOutstandingByDealer(@Param("dealerId") String dealerId);

    @Query("SELECT f FROM Farmer f WHERE f.dealer.id = :dealerId AND f.outstandingBalance > 0 ORDER BY f.outstandingBalance DESC")
    List<Farmer> findTopDebtors(@Param("dealerId") String dealerId, org.springframework.data.domain.Pageable pageable);
}
