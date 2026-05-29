package com.agridesk.repository;

import com.agridesk.entity.CreditEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CreditEntryRepository extends JpaRepository<CreditEntry, String> {

    // Caller MUST pass non-null from/to. The previous version used
    // ":from IS NULL OR e.date >= :from" which silently worked on H2 but
    // failed on PostgreSQL with 42P18 (could not determine data type of
    // parameter $2) when both bounds were null. LedgerService now substitutes
    // Instant.EPOCH and a far-future sentinel for unbounded queries.
    @Query("SELECT e FROM CreditEntry e WHERE e.farmer.dealer.id = :dealerId " +
           "AND e.date >= :from AND e.date <= :to " +
           "ORDER BY e.date DESC")
    List<CreditEntry> findByDealer(@Param("dealerId") String dealerId,
                                   @Param("from") Instant from,
                                   @Param("to") Instant to);

    Optional<CreditEntry> findByIdAndFarmer_Dealer_Id(String id, String dealerId);
}
