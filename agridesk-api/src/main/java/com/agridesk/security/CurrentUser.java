package com.agridesk.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

public final class CurrentUser {
    private CurrentUser() {}

    public static AuthPrincipal get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof AuthPrincipal p)) {
            throw new ResponseStatusException(UNAUTHORIZED, "Not authenticated");
        }
        return p;
    }

    public static String dealerId() {
        return get().dealerId();
    }

    public static String userId() {
        return get().userId();
    }
}
