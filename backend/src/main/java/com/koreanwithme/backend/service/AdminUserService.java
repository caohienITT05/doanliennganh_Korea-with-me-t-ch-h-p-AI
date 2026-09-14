package com.koreanwithme.backend.service;

import com.koreanwithme.backend.dto.UserResponse;
import com.koreanwithme.backend.entity.User;
import com.koreanwithme.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    @Autowired
    private UserRepository userRepository;

    // 1. Lấy toàn bộ danh sách người dùng
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // 2. Khóa hoặc Mở khóa tài khoản
    @Transactional
    public UserResponse toggleUserStatus(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        if (user.getStatus() == User.Status.LOCKED) {
            user.setStatus(User.Status.ACTIVE);
        } else {
            user.setStatus(User.Status.LOCKED);
        }

        userRepository.save(user);
        return UserResponse.fromEntity(user);
    }

    // 3. Thay đổi vai trò (ADMIN <-> USER)
    @Transactional
    public UserResponse toggleUserRole(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        if (user.getRole() == User.Role.ADMIN) {
            user.setRole(User.Role.USER);
        } else {
            user.setRole(User.Role.ADMIN);
        }

        userRepository.save(user);
        return UserResponse.fromEntity(user);
    }
}