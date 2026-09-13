package com.koreanwithme.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {
    // Chìa khóa bí mật để ký thẻ (Phải dài ít nhất 32 ký tự). Hãy giữ kín mã này!
    private final String jwtSecret = "KoreanWithMeSecretKeyDAPhenikaa2026SuperSecureCode";

    // Thẻ có hạn trong 24 giờ (tính bằng milliseconds)
    private final long jwtExpirationMs = 86400000;

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // 1. Hàm tạo thẻ JWT khi đăng nhập thành công
    public String generateJwtToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // 2. Hàm lấy Email từ thẻ JWT
    public String getEmailFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(getSigningKey()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    // 3. Hàm kiểm tra thẻ JWT có phải hàng giả hoặc hết hạn không
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            System.err.println("Thẻ JWT không hợp lệ: " + e.getMessage());
        }
        return false;
    }
}