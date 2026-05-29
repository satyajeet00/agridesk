package com.agridesk.controller;

import com.agridesk.dto.auth.AuthResponse;
import com.agridesk.dto.auth.LoginRequest;
import com.agridesk.dto.auth.SignupRequest;
import com.agridesk.security.AuthPrincipal;
import com.agridesk.security.CurrentUser;
import com.agridesk.service.AuthService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "1. Auth", description = "Signup, login, and current-user lookup. Signup and login are the only public endpoints; everything else requires the returned JWT.")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public AuthResponse signup(@Valid @RequestBody SignupRequest req) {
        return authService.signup(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @GetMapping("/me")
    public Map<String, String> me() {
        AuthPrincipal p = CurrentUser.get();
        return Map.of(
                "userId", p.userId(),
                "email", p.email(),
                "dealerId", p.dealerId(),
                "role", p.role()
        );
    }
}
