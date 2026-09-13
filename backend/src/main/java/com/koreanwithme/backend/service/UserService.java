package com.koreanwithme.backend.service;

import com.koreanwithme.backend.entity.User;
import com.koreanwithme.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // Hàm lấy danh sách tất cả người dùng
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Hàm tạo nhanh một User để test
    public User createTestUser() {
        User user = new User();
        user.setFullName("Học sinh Test");
        user.setEmail("test@koreanwithme.com");
        user.setPassword("123456"); // Tạm thời để text thường, sau này mình sẽ dùng BCrypt mã hóa sau

        return userRepository.save(user); // Lưu xuống Database
    }
}