package com.agridesk.service;

import com.agridesk.dto.settings.DealerResponse;
import com.agridesk.dto.settings.DealerUpdateRequest;
import com.agridesk.dto.settings.StaffRequest;
import com.agridesk.dto.settings.StaffResponse;
import com.agridesk.entity.Dealer;
import com.agridesk.entity.User;
import com.agridesk.repository.DealerRepository;
import com.agridesk.repository.UserRepository;
import com.agridesk.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final DealerRepository dealerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DealerResponse getDealer() {
        Dealer dealer = dealerRepository.findById(CurrentUser.dealerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "dealer_not_found"));
        return DealerResponse.from(dealer);
    }

    @Transactional
    public DealerResponse updateDealer(DealerUpdateRequest req) {
        Dealer dealer = dealerRepository.findById(CurrentUser.dealerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "dealer_not_found"));

        dealer.setShopName(req.shopName());
        if (req.phone() != null) dealer.setPhone(req.phone());
        dealer.setEmail(req.email());
        dealer.setAddress(req.address());
        dealer.setGstin(req.gstin());
        if (req.language() != null) dealer.setLanguage(req.language());

        return DealerResponse.from(dealerRepository.save(dealer));
    }

    public List<StaffResponse> listStaff() {
        return userRepository.findByDealer_IdOrderByCreatedAtAsc(CurrentUser.dealerId())
                .stream().map(StaffResponse::from).toList();
    }

    @Transactional
    public StaffResponse addStaff(StaffRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email_already_exists");
        }
        Dealer dealer = dealerRepository.findById(CurrentUser.dealerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "dealer_not_found"));
        User user = User.builder()
                .name(req.name())
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .role("staff")
                .dealer(dealer)
                .build();
        return StaffResponse.from(userRepository.save(user));
    }

    @Transactional
    public void removeStaff(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user_not_found"));
        if (!user.getDealer().getId().equals(CurrentUser.dealerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "not_allowed");
        }
        if ("owner".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "cannot_remove_owner");
        }
        userRepository.delete(user);
    }
}
