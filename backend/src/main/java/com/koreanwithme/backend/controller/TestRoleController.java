package com.koreanwithme.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TestRoleController {

    // API Khu vực Quản trị - Yêu cầu thẻ ADMIN
    @GetMapping("/admin/hello")
    public ResponseEntity<String> adminAccess() {
        return ResponseEntity.ok("😎 CHÀO SẾP! Bạn đã lọt qua chốt bảo vệ bằng thẻ ADMIN. Bạn có thể thêm/sửa/xóa khóa học.");
    }

    // API Khu vực Học tập - Yêu cầu thẻ USER (hoặc ADMIN)
    @GetMapping("/exams/hello")
    public ResponseEntity<String> userAccess() {
        return ResponseEntity.ok("🎓 CHÀO HỌC VIÊN! Bạn đã truy cập thành công vào khu vực thi TOPIK.");
    }
}