package com.neighbornest.auth.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Service for handling JWT token operations.
 * <p>
 * Provides methods for generating access tokens with custom claims,
 * validating tokens, and extracting claims. Uses HMAC-SHA256 algorithm
 * with a configurable secret key and expiration time.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@Slf4j
public class JwtService {

    private final String secretKey;
    private final long expirationMs;

    /**
     * Constructs the JWT service with configurable secret and expiration.
     *
     * @param secretKey    the Base64-encoded secret key for signing JWTs
     * @param expirationMs the access token expiration time in milliseconds
     */
    public JwtService(@Value("${app.jwt.secret}") final String secretKey,
                      @Value("${app.jwt.expiration-ms}") final long expirationMs) {
        this.secretKey = secretKey;
        this.expirationMs = expirationMs;
    }

    /**
     * Generates a JWT access token for the given user details.
     *
     * @param userId     the user's unique identifier
     * @param email      the user's email address
     * @param role       the user's role as a string
     * @param isOnboarded whether the user has completed onboarding
     * @return a signed JWT access token string
     */
    public String generateAccessToken(final Long userId, final String email,
                                      final String role, final boolean isOnboarded) {
        log.debug("Generating access token for user: {}", email);

        final Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("email", email);
        claims.put("role", role);
        claims.put("isOnboarded", isOnboarded);

        return buildToken(claims, email);
    }

    /**
     * Validates the given JWT token and returns {@code true} if it is valid.
     *
     * @param token the JWT token to validate
     * @return {@code true} if the token is valid and not expired
     */
    public boolean validateToken(final String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (SecurityException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.warn("JWT token is expired: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token format: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Unsupported JWT token: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    /**
     * Checks whether the given JWT token has expired.
     *
     * @param token the JWT token to check
     * @return {@code true} if the token is expired, {@code false} otherwise
     */
    public boolean isTokenExpired(final String token) {
        try {
            return extractAllClaims(token).getExpiration().before(new Date());
        } catch (ExpiredJwtException e) {
            return true;
        }
    }

    /**
     * Extracts the user ID claim from the given JWT token.
     *
     * @param token the JWT token
     * @return the user ID contained in the token
     */
    public Long extractUserId(final String token) {
        return extractAllClaims(token).get("userId", Long.class);
    }

    /**
     * Parses and returns all claims for a token in a single operation.
     * <p>
     * Callers that need several claims (e.g. the auth filter reading email +
     * role) should call this once and reuse the {@link Claims} object instead of
     * invoking {@code extractEmail}/{@code extractRole} separately, each of
     * which re-parses the token.
     * </p>
     *
     * @param token the JWT token
     * @return the parsed {@link Claims}
     */
    public Claims extractClaims(final String token) {
        return extractAllClaims(token);
    }

    /**
     * Extracts the email subject from the given JWT token.
     *
     * @param token the JWT token
     * @return the email (subject) contained in the token
     */
    public String extractEmail(final String token) {
        return extractAllClaims(token).getSubject();
    }

    /**
     * Extracts the role claim from the given JWT token.
     *
     * @param token the JWT token
     * @return the role contained in the token
     */
    public String extractRole(final String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    /**
     * Builds a signed JWT token with the provided claims and subject.
     *
     * @param claims  a map of custom claims to include in the token
     * @param subject the subject (typically email) of the token
     * @return a signed JWT string
     */
    private String buildToken(final Map<String, Object> claims, final String subject) {
        final Date now = new Date();
        final Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extracts all claims from the given JWT token.
     *
     * @param token the JWT token
     * @return the {@link Claims} object containing all token claims
     */
    private Claims extractAllClaims(final String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Creates an HMAC-SHA signing key from the Base64-encoded secret.
     *
     * @return a {@link SecretKey} for token signing and verification
     */
    private SecretKey getSigningKey() {
        final byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
