package com.agridesk.support;

import com.agridesk.entity.Dealer;
import com.agridesk.entity.User;
import com.agridesk.repository.DealerRepository;
import com.agridesk.repository.UserRepository;
import com.agridesk.security.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Component
public class TestHelpers {

    @Autowired
    private DealerRepository dealerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    public DealerToken createDealer() {
        return createDealer("Shop", "owner");
    }

    public DealerToken createDealer(String shopName, String emailPrefix) {
        String email = emailPrefix + "-" + UUID.randomUUID().toString().substring(0, 8) + "@test.com";
        return createDealer(shopName, email, "owner");
    }

    public DealerToken createDealer(String shopName, String email, String role) {
        Dealer dealer = Dealer.builder()
                .shopName(shopName)
                .ownerName("Owner " + shopName)
                .phone("9999999999")
                .email(email)
                .language("hi")
                .plan("trial")
                .trialEndsAt(Instant.now().plus(14, ChronoUnit.DAYS))
                .build();
        dealer = dealerRepository.save(dealer);

        User user = User.builder()
                .name("Owner " + shopName)
                .email(email)
                .password(passwordEncoder.encode("password123"))
                .phone("9999999999")
                .role(role)
                .dealer(dealer)
                .build();
        user = userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), dealer.getId(), user.getRole());
        return new DealerToken(dealer.getId(), user.getId(), email, token);
    }

    public String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public <T> T fromJson(String json, Class<T> clazz) {
        try {
            return objectMapper.readValue(json, clazz);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public com.fasterxml.jackson.databind.JsonNode tree(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public record DealerToken(String dealerId, String userId, String email, String token) {
        public String bearer() {
            return "Bearer " + token;
        }
    }
}
