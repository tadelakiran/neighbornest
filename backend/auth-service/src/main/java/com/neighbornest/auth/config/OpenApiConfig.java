package com.neighbornest.auth.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;

/**
 * OpenAPI 3.0 configuration for the Auth Service.
 * <p>
 * Provides metadata for the Swagger UI documentation, including
 * API title, description, version, contact info, and security
 * scheme configuration for Bearer JWT authentication.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@OpenAPIDefinition(
        info = @Info(
                title = "NeighborNest Auth Service API",
                version = "1.0.0",
                description = "Authentication and user management APIs for the NeighborNest platform. " +
                        "Supports registration, login, token refresh, and user profile retrieval.",
                contact = @Contact(
                        name = "NeighborNest Team",
                        email = "support@neighbornest.com"),
                license = @License(
                        name = "MIT License",
                        url = "https://opensource.org/licenses/MIT")),
        servers = {
                @Server(
                        description = "Local Development - Auth Service",
                        url = "http://localhost:8081"),
                @Server(
                        description = "API Gateway (Production)",
                        url = "http://localhost:8080")
        },
        security = {
                @SecurityRequirement(name = "bearerAuth")
        }
)
@SecurityScheme(
        name = "bearerAuth",
        description = "JWT Bearer token authentication. Obtain a token via POST /api/auth/login",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
    // Configuration is handled via annotations
}
