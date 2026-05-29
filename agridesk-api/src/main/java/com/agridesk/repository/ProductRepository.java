package com.agridesk.repository;

import com.agridesk.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByDealer_IdOrderByNameAsc(String dealerId);
    Optional<Product> findByIdAndDealer_Id(String id, String dealerId);
}
