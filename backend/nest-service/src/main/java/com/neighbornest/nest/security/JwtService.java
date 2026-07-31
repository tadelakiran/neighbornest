package com.neighbornest.nest.security;

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

/**
 * Service for validating JWTs issued by the auth-service.
 * <p>
 * Uses the same shared secret so tokens minted by the auth-service can be
 * verified here. Extracts the {@code userId} claim used to identify the
 * authenticated user.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@Slf4j
public class JwtService {

    private final SecretKey signingKey;

    /**
     * Constructs the JWT service with the shared secret.
     *
     * @param secretKey the Base64-encoded secret key used to sign auth tokens
     */
    public JwtService(@Value("${app.jwt.secret}") final String secretKey) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    }

    /**
     * Validates the given JWT and returns {@code true} if it is valid.
     *
     * @param token the JWT to validate
     * @return {@code true} if valid and not expired
     */
    public boolean isValid(final String token) {
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
     * Extracts the user ID claim from the given JWT.
     *
     * @param token the JWT token
     * @return the user ID contained in the token
     */
    public Long extractUserId(final String token) {
        return extractAllClaims(token).get("userId", Long.class);
    }

    /**
     * Extracts all claims from the given JWT.
     *
     * @param token the JWT token
     * @return the {@link Claims} object containing all token claims
     */
    private Claims extractAllClaims(final String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
