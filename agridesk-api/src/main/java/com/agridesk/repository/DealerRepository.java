package com.agridesk.repository;

import com.agridesk.entity.Dealer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DealerRepository extends JpaRepository<Dealer, String> {
}
