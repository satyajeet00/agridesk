package com.agridesk.dto.settings;

import com.agridesk.entity.Dealer;

import java.time.Instant;

public record DealerResponse(
        String id,
        String shopName,
        String ownerName,
        String phone,
        String email,
        String address,
        String gstin,
        String language,
        String plan,
        Instant trialEndsAt
) {
    public static DealerResponse from(Dealer d) {
        return new DealerResponse(
                d.getId(), d.getShopName(), d.getOwnerName(),
                d.getPhone(), d.getEmail(), d.getAddress(),
                d.getGstin(), d.getLanguage(),
                d.getPlan(), d.getTrialEndsAt()
        );
    }
}
