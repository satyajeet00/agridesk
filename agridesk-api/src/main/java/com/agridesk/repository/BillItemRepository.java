package com.agridesk.repository;

import com.agridesk.entity.BillItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillItemRepository extends JpaRepository<BillItem, String> {
}
