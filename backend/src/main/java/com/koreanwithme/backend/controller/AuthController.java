package com.koreanwithme.backend.controller;

import com.koreanwithme.backend.dto.RegisterRequest;
import com.koreanwithme.backend.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // Đảm bảo không bị chặn bởi CORS
public class AuthController {

    @Autowired
    private AuthService authService;
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        try {
            System.out.println(">>> Đang kiểm tra đăng nhập cho email: " + email);
            Map<String, Object> authData = authService.login(email, password);
            System.out.println(">>> ĐĂNG NHẬP THÀNH CÔNG: " + email);
            return ResponseEntity.ok(authData);

        } catch (Exception e) {
            // In rõ nguyên nhân lỗi ra Terminal IntelliJ để bạn nhìn thấy ngay lập tức
            System.err.println(">>> ĐĂNG NHẬP THẤT BẠI CHO [" + email + "]: " + e.getMessage());

            // Đổi sang BAD_REQUEST (400) để trình duyệt không chặn CORS và hiển thị được câu báo lỗi thật
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            return ResponseEntity.ok(Collections.singletonMap("message", "Đăng ký thành công! Vui lòng xác thực mã OTP."));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", e.getMessage()));
        }
    }
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String otp = request.get("otp");
            authService.verifyOtp(email, otp);
            return ResponseEntity.ok(Collections.singletonMap("message", "Xác thực tài khoản thành công!"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", e.getMessage()));
        }
    }
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Collections.singletonMap("message", "Email không được để trống!"));
            }
            authService.forgotPassword(email);
            return ResponseEntity.ok(Collections.singletonMap("message", "Mã xác thực đã được gửi đến email của bạn!"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", e.getMessage()));
        }
    }
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String newPassword = request.get("newPassword");
            authService.resetPassword(email, newPassword);
            return ResponseEntity.ok(Collections.singletonMap("message", "Đổi mật khẩu thành công!"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", e.getMessage()));
        }
    }
}