package com.agridesk.dto.farmer;

import com.agridesk.entity.Farmer;

import java.time.Instant;

public record FarmerResponse(
        String id,
        String name,
        String phone,
        String village,
        String crops,
        Double outstandingBalance,
        Instant createdAt
) {
    public static FarmerResponse from(Farmer f) {
        return new FarmerResponse(
                f.getId(), f.getName(), f.getPhone(),
                f.getVillage(), f.getCrops(), f.getOutstandingBalance(),
                f.getCreatedAt()
        );
    }
}
