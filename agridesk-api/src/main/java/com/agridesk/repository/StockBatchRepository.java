package com.agridesk.repository;

import com.agridesk.entity.StockBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface StockBatchRepository extends JpaRepository<StockBatch, String> {

    Optional<StockBatch> findByIdAndProduct_Dealer_Id(String id, String dealerId);

    @Query("SELECT b FROM StockBatch b WHERE b.product.dealer.id = :dealerId " +
           "AND b.expiryDate IS NOT NULL AND b.expiryDate >= :now AND b.expiryDate <= :threshold " +
           "AND b.quantity > 0 ORDER BY b.expiryDate ASC")
    List<StockBatch> findExpiring(@Param("dealerId") String dealerId,
                                  @Param("now") Instant now,
                                  @Param("threshold") Instant threshold);

    @Query("SELECT COUNT(b) FROM StockBatch b WHERE b.product.dealer.id = :dealerId " +
           "AND b.expiryDate IS NOT NULL AND b.expiryDate >= :now AND b.expiryDate <= :threshold " +
           "AND b.quantity > 0")
    long countExpiring(@Param("dealerId") String dealerId,
                       @Param("now") Instant now,
                       @Param("threshold") Instant threshold);
}
