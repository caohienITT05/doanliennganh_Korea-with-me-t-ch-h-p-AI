package com.koreanwithme.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "is_free")
    private Boolean isFree = false;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.OPEN;

    @Builder.Default
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Status {
        OPEN, CLOSED
    }

    // Viết trực tiếp Getter & Setter để Java Compiler luôn tìm thấy phương thức
    public Status getStatus() {
        return this.status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    // Hỗ trợ truyền thẳng chuỗi String vào nếu cần
    public void setStatus(String statusStr) {
        if (statusStr != null) {
            try {
                this.status = Status.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                this.status = Status.OPEN;
            }
        }
    }
}