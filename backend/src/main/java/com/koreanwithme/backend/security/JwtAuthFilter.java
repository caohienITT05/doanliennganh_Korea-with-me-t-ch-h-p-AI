package com.koreanwithme.backend.security;

import com.koreanwithme.backend.entity.User;
import com.koreanwithme.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // 1. Lấy thẻ JWT từ Header của request
            String jwt = parseJwt(request);

            // 2. Nếu có thẻ và thẻ chuẩn
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                // Rút email từ thẻ
                String email = jwtUtils.getEmailFromJwtToken(jwt);

                // Tìm User trong Database
                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));

                // Tạo danh sách quyền hạn (Spring Security yêu cầu Role phải có chữ ROLE_ phía trước)
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

                // Xác nhận cho phép đi qua
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(user, null, Collections.singletonList(authority));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            System.err.println("Không thể thiết lập xác thực người dùng: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    // Hàm lấy token từ chuỗi "Bearer <token>"
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        if (headerAuth != null && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}