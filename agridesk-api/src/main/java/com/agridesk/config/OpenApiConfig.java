package com.agridesk.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "AgriDesk API",
                version = "v1",
                description = """
                        Multi-tenant SaaS backend for Indian agri-input dealers.

                        AgriDesk gives fertilizer / pesticide / seed shop owners a Hindi-first
                        digital ledger to manage farmer credit (udhari), stock with expiry tracking,
                        and GST-compliant billing — for ₹499/month.

                        All endpoints except `/api/auth/signup`, `/api/auth/login`, and the
                        Razorpay webhook require a JWT Bearer token. Click the **Authorize**
                        button (top-right) to paste a token and try requests live.

                        Multi-tenancy: every authenticated request is scoped to the dealer
                        embedded in the JWT. There is no way to read or write another dealer's
                        data, even with a tampered request body.
                        """,
                contact = @Contact(name = "AgriDesk", url = "https://github.com/satyajeet00/agridesk"),
                license = @License(name = "MIT", url = "https://github.com/satyajeet00/agridesk/blob/main/LICENSE")
        ),
        servers = {
                @Server(url = "http://127.0.0.1:8080", description = "Local development"),
                @Server(url = "https://agridesk-api.onrender.com", description = "Production (placeholder; update after first deploy)")
        }
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Paste a JWT obtained from POST /api/auth/login or /api/auth/signup"
)
public class OpenApiConfig {
}
