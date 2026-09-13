package com.koreanwithme.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    // Sửa lại Status: Mặc định khi mới tạo sẽ là UNVERIFIED
    @Enumerated(EnumType.STRING)
    private Status status = Status.UNVERIFIED;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // --- CÁC CỘT MỚI ĐỂ XÁC THỰC VÀ QUÊN MẬT KHẨU ---
    @Column(name = "verification_token")
    private String verificationToken; // Link xác nhận đăng ký

    @Column(name = "otp_code", length = 6)
    private String otpCode; // Mã OTP 6 số

    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry; // Hạn sử dụng của OTP

    public enum Role { ADMIN, USER }
    public enum Status { UNVERIFIED, ACTIVE, LOCKED }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}