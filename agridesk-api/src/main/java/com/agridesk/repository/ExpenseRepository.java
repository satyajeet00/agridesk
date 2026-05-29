package com.agridesk.repository;

import com.agridesk.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, String> {
    List<Expense> findByDealer_IdOrderByDateDesc(String dealerId);
}
