package com.neighbornest.auth.service;

import com.neighbornest.auth.dto.request.LoginRequest;
import com.neighbornest.auth.dto.request.LogoutRequest;
import com.neighbornest.auth.dto.request.RefreshTokenRequest;
import com.neighbornest.auth.dto.request.RegisterRequest;
import com.neighbornest.auth.dto.response.AuthResponse;
import com.neighbornest.auth.dto.response.UserResponse;
import com.neighbornest.auth.entity.Role;
import com.neighbornest.auth.exception.InvalidCredentialsException;
import com.neighbornest.auth.exception.TokenExpiredException;
import com.neighbornest.auth.exception.UserAlreadyExistsException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for {@link AuthService}.
 * <p>
 * Uses {@link SpringBootTest} with a full application context and H2 in-memory
 * database, eliminating the need for Mockito mocks or hand-written stubs.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@SpringBootTest(properties = {
        "eureka.client.enabled=false",
        "spring.cloud.discovery.enabled=false"
})
@ActiveProfiles("test")
@DisplayName("AuthService Integration Tests")
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    private static final String TEST_EMAIL = "john.doe@example.com";
    private static final String TEST_PASSWORD = "Pass@123";
    private static final String TEST_FULL_NAME = "John Doe";

    @Nested
    @DisplayName("Register method")
    class RegisterTests {

        /**
         * Tests successful user registration.
         */
        @Test
        @DisplayName("Should register user successfully")
        void shouldRegisterUserSuccessfully() {
            final RegisterRequest request = RegisterRequest.builder()
                    .fullName(TEST_FULL_NAME)
                    .email(TEST_EMAIL)
                    .password(TEST_PASSWORD)
                    .build();

            final UserResponse response = authService.register(request);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isNotNull();
            assertThat(response.getEmail()).isEqualTo(TEST_EMAIL.toLowerCase());
            assertThat(response.getFullName()).isEqualTo(TEST_FULL_NAME);
            assertThat(response.getRole()).isEqualTo(Role.NEWCOMER);
            assertThat(response.getIsOnboarded()).isFalse();
        }

        /**
         * Tests that registration throws an exception for duplicate email.
         */
        @Test
        @DisplayName("Should throw exception when email already exists")
        void shouldThrowExceptionWhenEmailAlreadyExists() {
            final RegisterRequest firstRequest = RegisterRequest.builder()
                    .fullName(TEST_FULL_NAME)
                    .email("duplicate." + TEST_EMAIL)
                    .password(TEST_PASSWORD)
                    .build();
            authService.register(firstRequest);

            final RegisterRequest duplicateRequest = RegisterRequest.builder()
                    .fullName("Jane Doe")
                    .email("duplicate." + TEST_EMAIL)
                    .password("Test@1234")
                    .build();

            assertThatThrownBy(() -> authService.register(duplicateRequest))
                    .isInstanceOf(UserAlreadyExistsException.class)
                    .hasMessageContaining("already registered");
        }

        /**
         * Tests that registration fails with a weak password.
         */
        @Test
        @DisplayName("Should throw exception for weak password")
        void shouldThrowExceptionForWeakPassword() {
            final RegisterRequest request = RegisterRequest.builder()
                    .fullName(TEST_FULL_NAME)
                    .email("weak." + TEST_EMAIL)
                    .password("weak")
                    .build();

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Password validation failed");
        }
    }

    @Nested
    @DisplayName("Login method")
    class LoginTests {

        /**
         * Tests successful login.
         */
        @Test
        @DisplayName("Should login successfully")
        void shouldLoginSuccessfully() {
            final String email = "login.success@example.com";
            authService.register(RegisterRequest.builder()
                    .fullName(TEST_FULL_NAME)
                    .email(email)
                    .password(TEST_PASSWORD)
                    .build());

            final LoginRequest request = LoginRequest.builder()
                    .email(email)
                    .password(TEST_PASSWORD)
                    .build();

            final AuthResponse response = authService.login(request);

            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isNotNull();
            assertThat(response.getRefreshToken()).isNotNull();
            assertThat(response.getTokenType()).isEqualTo("Bearer");
            assertThat(response.getExpiresIn()).isPositive();
        }

        /**
         * Tests that login throws exception for wrong password.
         */
        @Test
        @DisplayName("Should throw exception for wrong password")
        void shouldThrowExceptionForWrongPassword() {
            final String email = "login.wrongpw@example.com";
            authService.register(RegisterRequest.builder()
                    .fullName(TEST_FULL_NAME)
                    .email(email)
                    .password(TEST_PASSWORD)
                    .build());

            final LoginRequest request = LoginRequest.builder()
                    .email(email)
                    .password("wrong-password")
                    .build();

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(InvalidCredentialsException.class)
                    .hasMessageContaining("Invalid email or password");
        }

        /**
         * Tests that login throws exception for non-existent email.
         */
        @Test
        @DisplayName("Should throw exception for non-existent email")
        void shouldThrowExceptionForNonExistentEmail() {
            final LoginRequest request = LoginRequest.builder()
                    .email("nonexistent@example.com")
                    .password(TEST_PASSWORD)
                    .build();

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(InvalidCredentialsException.class)
                    .hasMessageContaining("Invalid email or password");
        }
    }

    @Nested
    @DisplayName("Refresh method")
    class RefreshTests {

        /**
         * Tests successful token refresh.
         */
        @Test
        @DisplayName("Should refresh token successfully")
        void shouldRefreshTokenSuccessfully() {
            final String email = "refresh.success@example.com";
            authService.register(RegisterRequest.builder()
                    .fullName(TEST_FULL_NAME)
                    .email(email)
                    .password(TEST_PASSWORD)
                    .build());

            final AuthResponse loginResponse = authService.login(
                    LoginRequest.builder().email(email).password(TEST_PASSWORD).build());

            final RefreshTokenRequest request = RefreshTokenRequest.builder()
                    .refreshToken(loginResponse.getRefreshToken())
                    .build();

            final AuthResponse response = authService.refresh(request);

            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isNotNull();
            assertThat(response.getRefreshToken()).isNotNull();
            assertThat(response.getRefreshToken()).isNotEqualTo(loginResponse.getRefreshToken());
            assertThat(response.getTokenType()).isEqualTo("Bearer");
        }

        /**
         * Tests that refresh throws exception for invalid token.
         */
        @Test
        @DisplayName("Should throw exception for invalid refresh token")
        void shouldThrowExceptionForInvalidToken() {
            final RefreshTokenRequest request = RefreshTokenRequest.builder()
                    .refreshToken("invalid-token")
                    .build();

            assertThatThrownBy(() -> authService.refresh(request))
                    .isInstanceOf(TokenExpiredException.class)
                    .hasMessageContaining("Invalid refresh token");
        }
    }

    @Nested
    @DisplayName("Logout method")
    class LogoutTests {

        /**
         * Tests successful logout with a refresh token.
         */
        @Test
        @DisplayName("Should logout and invalidate refresh token")
        void shouldLogoutAndInvalidateToken() {
            final String email = "logout.test@example.com";
            authService.register(RegisterRequest.builder()
                    .fullName(TEST_FULL_NAME)
                    .email(email)
                    .password(TEST_PASSWORD)
                    .build());

            final AuthResponse loginResponse = authService.login(
                    LoginRequest.builder().email(email).password(TEST_PASSWORD).build());

            final LogoutRequest logoutRequest = LogoutRequest.builder()
                    .refreshToken(loginResponse.getRefreshToken())
                    .build();

            authService.logout(logoutRequest);

            // Verify token is invalidated by trying to refresh with it
            assertThatThrownBy(() -> authService.refresh(
                    RefreshTokenRequest.builder().refreshToken(loginResponse.getRefreshToken()).build()))
                    .isInstanceOf(TokenExpiredException.class);
        }

        /**
         * Tests logout without providing a refresh token.
         */
        @Test
        @DisplayName("Should logout without error when no refresh token provided")
        void shouldLogoutWithoutToken() {
            final String email = "logout.notoken@example.com";
            authService.register(RegisterRequest.builder()
                    .fullName(TEST_FULL_NAME)
                    .email(email)
                    .password(TEST_PASSWORD)
                    .build());

            // Should not throw any exception
            authService.logout(null);

            // User should still be able to login
            final AuthResponse response = authService.login(
                    LoginRequest.builder().email(email).password(TEST_PASSWORD).build());
            assertThat(response).isNotNull();
        }
    }
}
