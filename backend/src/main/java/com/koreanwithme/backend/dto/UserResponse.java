package com.koreanwithme.backend.dto;

import com.koreanwithme.backend.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserResponse {
    private Integer id;
    private String fullName;
    private String email;
    private String role;
    private String status;
    private LocalDateTime createdAt;

    // Chuyển đổi từ User Entity sang UserResponse an toàn
    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().name() : "USER")
                .status(user.getStatus() != null ? user.getStatus().name() : "UNVERIFIED")
                .createdAt(user.getCreatedAt())
                .build();
    }
}