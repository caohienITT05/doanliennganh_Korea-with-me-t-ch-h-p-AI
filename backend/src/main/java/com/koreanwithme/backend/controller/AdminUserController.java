package com.koreanwithme.backend.controller;

import com.koreanwithme.backend.dto.UserResponse;
import com.koreanwithme.backend.service.AdminUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "*")
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;

    // GET: /api/admin/users
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    // PATCH: /api/admin/users/{id}/toggle-status
    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Integer id) {
        try {
            UserResponse updatedUser = adminUserService.toggleUserStatus(id);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // PATCH: /api/admin/users/{id}/toggle-role
    @PatchMapping("/{id}/toggle-role")
    public ResponseEntity<?> toggleUserRole(@PathVariable Integer id) {
        try {
            UserResponse updatedUser = adminUserService.toggleUserRole(id);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }
}