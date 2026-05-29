package com.agridesk.repository;

import com.agridesk.entity.CreditEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CreditEntryRepository extends JpaRepository<CreditEntry, String> {

    @Query("SELECT e FROM CreditEntry e WHERE e.farmer.dealer.id = :dealerId " +
           "AND (:from IS NULL OR e.date >= :from) " +
           "AND (:to IS NULL OR e.date <= :to) " +
           "ORDER BY e.date DESC")
    List<CreditEntry> findByDealer(@Param("dealerId") String dealerId,
                                   @Param("from") Instant from,
                                   @Param("to") Instant to);

    Optional<CreditEntry> findByIdAndFarmer_Dealer_Id(String id, String dealerId);
}
