package com.agridesk.service;

import com.agridesk.dto.auth.AuthResponse;
import com.agridesk.dto.auth.LoginRequest;
import com.agridesk.dto.auth.SignupRequest;
import com.agridesk.entity.Dealer;
import com.agridesk.entity.User;
import com.agridesk.repository.DealerRepository;
import com.agridesk.repository.UserRepository;
import com.agridesk.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final DealerRepository dealerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse signup(SignupRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email_already_exists");
        }

        Dealer dealer = Dealer.builder()
                .shopName(req.shopName())
                .ownerName(req.ownerName())
                .phone(req.phone())
                .email(req.email())
                .language(req.language() == null ? "hi" : req.language())
                .plan("trial")
                .trialEndsAt(Instant.now().plus(14, ChronoUnit.DAYS))
                .build();
        dealer = dealerRepository.save(dealer);

        User user = User.builder()
                .name(req.ownerName())
                .email(req.email())
                .password(passwordEncoder.encode(req.password()))
                .phone(req.phone())
                .role("owner")
                .dealer(dealer)
                .build();
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), dealer.getId(), user.getRole());

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                dealer.getId(),
                dealer.getShopName(),
                dealer.getLanguage()
        );
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials"));

        if (!passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "invalid_credentials");
        }

        Dealer dealer = user.getDealer();
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), dealer.getId(), user.getRole());

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                dealer.getId(),
                dealer.getShopName(),
                dealer.getLanguage()
        );
    }
}
