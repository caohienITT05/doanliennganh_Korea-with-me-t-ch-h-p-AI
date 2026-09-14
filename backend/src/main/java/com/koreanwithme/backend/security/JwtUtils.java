package com.koreanwithme.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {

    // Khóa cố định tối thiểu 256-bit (32 ký tự trở lên)
    private static final String SECRET_STRING = "korean_with_me_super_secret_jwt_key_2026_phenikaa_secure_token";
    private static final Key SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes());
    private static final long EXPIRATION_MS = 86400000L; // 24 giờ

    // 1. Tạo token từ email
    public String generateJwtToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(SECRET_KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    // 2. Lấy email từ token
    public String getEmailFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // 3. Kiểm tra tính hợp lệ của token
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(SECRET_KEY).build().parseClaimsJws(authToken);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            System.err.println("Chữ ký JWT không đúng: " + e.getMessage());
        } catch (ExpiredJwtException e) {
            System.err.println("JWT đã hết hạn: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.err.println("JWT không được hỗ trợ: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            System.err.println("JWT rỗng: " + e.getMessage());
        }
        return false;
    }
}