package com.koreanwithme.backend.repository;

import com.koreanwithme.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    // Tự động tạo hàm tìm user bằng email (Spring Boot tự hiểu logic này)
    Optional<User> findByEmail(String email);
    Optional<User> findByVerificationToken(String token); // hàm tìm User theo mã xác nhận đăng ký
}