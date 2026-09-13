package com.koreanwithme.backend.controller;

import com.koreanwithme.backend.entity.User;
import com.koreanwithme.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // API 1: Lấy danh sách User (Method: GET)
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // API 2: Tạo User test (Dùng GET tạm để bạn dễ test trực tiếp trên trình duyệt)
    @GetMapping("/test")
    public User createTestUser() {
        return userService.createTestUser();
    }
}