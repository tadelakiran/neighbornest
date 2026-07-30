package com.neighbornest.auth.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.neighbornest.auth.dto.request.LoginRequest;
import com.neighbornest.auth.dto.request.RefreshTokenRequest;
import com.neighbornest.auth.dto.request.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for {@link AuthController}.
 * <p>
 * Uses {@link SpringBootTest} with a full application context and H2 in-memory
 * database. Authentication-protected endpoints use {@link WithMockUser} or
 * valid JWT tokens obtained through the login flow.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("AuthController Integration Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String REGISTER_URL = "/api/auth/register";
    private static final String LOGIN_URL = "/api/auth/login";
    private static final String REFRESH_URL = "/api/auth/refresh";
    private static final String LOGOUT_URL = "/api/auth/logout";

    /**
     * Generates a unique email for test isolation.
     */
    private static String uniqueEmail(final String prefix) {
        return prefix + "." + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
    }

    @Nested
    @DisplayName("POST /api/auth/register")
    class RegisterEndpoint {

        /**
         * Tests that a valid registration request returns 201 CREATED.
         */
        @Test
        @DisplayName("Should return 201 for valid registration")
        void shouldReturn201ForValidRegistration() throws Exception {
            final RegisterRequest request = RegisterRequest.builder()
                    .fullName("John Doe")
                    .email(uniqueEmail("register"))
                    .password("Pass@123")
                    .build();

            mockMvc.perform(post(REGISTER_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.email").isNotEmpty())
                    .andExpect(jsonPath("$.full_name").value("John Doe"))
                    .andExpect(jsonPath("$.role").value("NEWCOMER"));
        }

        /**
         * Tests that an invalid request returns 400 BAD REQUEST.
         */
        @Test
        @DisplayName("Should return 400 for invalid registration data")
        void shouldReturn400ForInvalidData() throws Exception {
            final RegisterRequest request = RegisterRequest.builder()
                    .fullName("John Doe")
                    .email("invalid-email")
                    .password("short")
                    .build();

            mockMvc.perform(post(REGISTER_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        /**
         * Tests that registering with an existing email returns 409 CONFLICT.
         */
        @Test
        @DisplayName("Should return 409 for duplicate email")
        void shouldReturn409ForDuplicateEmail() throws Exception {
            final String email = uniqueEmail("duplicate");

            // First registration
            final RegisterRequest firstRequest = RegisterRequest.builder()
                    .fullName("John Doe")
                    .email(email)
                    .password("Pass@123")
                    .build();
            mockMvc.perform(post(REGISTER_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(firstRequest)))
                    .andExpect(status().isCreated());

            // Duplicate registration
            final RegisterRequest duplicateRequest = RegisterRequest.builder()
                    .fullName("Jane Doe")
                    .email(email)
                    .password("Test@1234")
                    .build();
            mockMvc.perform(post(REGISTER_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(duplicateRequest)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("Email " + email + " is already registered"));
        }
    }

    @Nested
    @DisplayName("POST /api/auth/login")
    class LoginEndpoint {

        /**
         * Tests that a valid login request returns 200 OK with tokens.
         */
        @Test
        @DisplayName("Should return 200 for valid credentials")
        void shouldReturn200ForValidCredentials() throws Exception {
            final String email = uniqueEmail("login");
            registerUser(email, "Pass@123");

            final LoginRequest request = LoginRequest.builder()
                    .email(email)
                    .password("Pass@123")
                    .build();

            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.access_token").isNotEmpty())
                    .andExpect(jsonPath("$.refresh_token").isNotEmpty())
                    .andExpect(jsonPath("$.token_type").value("Bearer"))
                    .andExpect(jsonPath("$.expires_in").isNumber());
        }

        /**
         * Tests that wrong password returns 401 UNAUTHORIZED.
         */
        @Test
        @DisplayName("Should return 401 for wrong password")
        void shouldReturn401ForWrongPassword() throws Exception {
            final String email = uniqueEmail("login");
            registerUser(email, "Pass@123");

            final LoginRequest request = LoginRequest.builder()
                    .email(email)
                    .password("wrong-password")
                    .build();

            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid email or password"));
        }

        /**
         * Tests that non-existent email returns 401 UNAUTHORIZED.
         */
        @Test
        @DisplayName("Should return 401 for non-existent email")
        void shouldReturn401ForNonExistentEmail() throws Exception {
            final LoginRequest request = LoginRequest.builder()
                    .email("nonexistent@example.com")
                    .password("Pass@123")
                    .build();

            mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("Invalid email or password"));
        }

        private void registerUser(final String email, final String password) throws Exception {
            final RegisterRequest request = RegisterRequest.builder()
                    .fullName("John Doe")
                    .email(email)
                    .password(password)
                    .build();
            mockMvc.perform(post(REGISTER_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)));
        }
    }

    @Nested
    @DisplayName("POST /api/auth/refresh")
    class RefreshEndpoint {

        /**
         * Tests that a valid refresh request returns 200 OK.
         */
        @Test
        @DisplayName("Should return 200 for valid refresh token")
        void shouldReturn200ForValidRefreshToken() throws Exception {
            final String refreshToken = loginAndGetRefreshToken();

            final RefreshTokenRequest request = RefreshTokenRequest.builder()
                    .refreshToken(refreshToken)
                    .build();

            mockMvc.perform(post(REFRESH_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.access_token").isNotEmpty())
                    .andExpect(jsonPath("$.refresh_token").isNotEmpty())
                    .andExpect(jsonPath("$.token_type").value("Bearer"));
        }

        /**
         * Tests that an invalid refresh token returns 401 UNAUTHORIZED.
         */
        @Test
        @DisplayName("Should return 401 for invalid refresh token")
        void shouldReturn401ForInvalidRefreshToken() throws Exception {
            final RefreshTokenRequest request = RefreshTokenRequest.builder()
                    .refreshToken("invalid-refresh-token")
                    .build();

            mockMvc.perform(post(REFRESH_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }

        /**
         * Registers a user, logs in, and extracts the refresh token.
         */
        private String loginAndGetRefreshToken() throws Exception {
            final String email = uniqueEmail("refresh");

            final RegisterRequest registerRequest = RegisterRequest.builder()
                    .fullName("John Doe")
                    .email(email)
                    .password("Pass@123")
                    .build();
            mockMvc.perform(post(REGISTER_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(registerRequest)));

            final LoginRequest loginRequest = LoginRequest.builder()
                    .email(email)
                    .password("Pass@123")
                    .build();

            final String response = mockMvc.perform(post(LOGIN_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andReturn()
                    .getResponse()
                    .getContentAsString();

            final JsonNode root = objectMapper.readTree(response);
            return root.get("refresh_token").asText();
        }
    }

    @Nested
    @DisplayName("POST /api/auth/logout")
    class LogoutEndpoint {

        /**
         * Tests that an authenticated logout request returns 200 OK.
         */
        @Test
        @WithMockUser(username = "test@example.com", roles = {"NEWCOMER"})
        @DisplayName("Should return 200 for authenticated logout")
        void shouldReturn200ForAuthenticatedLogout() throws Exception {
            mockMvc.perform(post(LOGOUT_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isOk());
        }

        /**
         * Tests that unauthenticated logout returns 403 Forbidden (Spring Security default
         * for requests without any authentication credentials).
         */
        @Test
        @DisplayName("Should return 403 for unauthenticated logout")
        void shouldReturn403ForUnauthenticatedLogout() throws Exception {
            mockMvc.perform(post(LOGOUT_URL)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isForbidden());
        }
    }
}
