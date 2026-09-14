package com.koreanwithme.backend.service;

import com.koreanwithme.backend.dto.RegisterRequest;
import com.koreanwithme.backend.entity.User;
import com.koreanwithme.backend.repository.UserRepository;
import com.koreanwithme.backend.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private JwtUtils jwtUtils; // Dùng chung JwtUtils với JwtAuthFilter

    // --- 1. ĐĂNG NHẬP ---


    public Map<String, Object> login(String email, String password) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không chính xác!"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Email hoặc mật khẩu không chính xác!");
        }

        if (user.getStatus() == User.Status.UNVERIFIED) {
            throw new RuntimeException("Tài khoản chưa được kích hoạt! Vui lòng xác thực mã OTP.");
        }

        // TẠO TOKEN BẰNG JWTUTILS
        String token = jwtUtils.generateJwtToken(user.getEmail());

        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("email", user.getEmail());
        result.put("fullName", user.getFullName());
        result.put("role", user.getRole() != null ? user.getRole().name() : "USER");
        result.put("message", "Đăng nhập thành công!");

        return result;
    }

    // --- 2. ĐĂNG KÝ ---
    @Transactional
    public void register(RegisterRequest request) {
        Optional<User> existingUserOpt = userRepository.findByEmail(request.getEmail().trim().toLowerCase());

        User user;
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (user.getStatus() == User.Status.ACTIVE) {
                throw new RuntimeException("Email này đã được đăng ký và kích hoạt!");
            }
            user.setFullName(request.getFullName());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        } else {
            user = new User();
            user.setFullName(request.getFullName());
            user.setEmail(request.getEmail().trim().toLowerCase());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            user.setRole(User.Role.USER);
            user.setStatus(User.Status.UNVERIFIED);
            user.setCreatedAt(LocalDateTime.now());
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        sendOtpEmail(user.getEmail(), otp);
    }

    // --- 3. XÁC THỰC OTP KÍCH HOẠT TÀI KHOẢN ---
    @Transactional
    public void verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin tài khoản!"));

        if (user.getOtpCode() == null || !user.getOtpCode().equals(otp)) {
            throw new RuntimeException("Mã OTP không chính xác!");
        }

        if (user.getOtpExpiry() != null && user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Mã OTP đã hết hạn!");
        }

        user.setStatus(User.Status.ACTIVE);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
    }

    // --- 4. QUÊN MẬT KHẨU ---
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản với email này!"));

        String otp = String.format("%06d", new Random().nextInt(999999));
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        System.out.println("=================================================");
        System.out.println(">>> MÃ OTP QUÊN MẬT KHẨU CHO [" + email + "] LÀ: " + otp);
        System.out.println("=================================================");

        sendOtpEmail(user.getEmail(), otp);
    }

    // --- 5. ĐẶT LẠI MẬT KHẨU MỚI ---
    @Transactional
    public void resetPassword(String email, String newPassword) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản!"));

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
    }

    // --- GỬI MAIL VÀ IN RA CONSOLE ---
    private void sendOtpEmail(String toEmail, String otp) {
        System.out.println("=================================================");
        System.out.println(">>> MÃ OTP XÁC THỰC CHO [" + toEmail + "] LÀ: " + otp);
        System.out.println("=================================================");

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("caothihien201005@gmail.com");
            message.setTo(toEmail);
            message.setSubject("Korean With Me - Mã xác thực kích hoạt tài khoản");
            message.setText("Chào bạn,\n\nMã OTP kích hoạt tài khoản của bạn là: " + otp + "\nMã có hiệu lực trong vòng 5 phút.\n\nTrân trọng!");
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Lưu ý: Không thể gửi mail qua mạng (" + e.getMessage() + ")");
            System.err.println("-> Hãy lấy mã OTP in ở trên console để nhập vào giao diện.");
        }
    }
}