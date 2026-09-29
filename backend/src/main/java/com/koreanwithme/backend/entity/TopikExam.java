package com.koreanwithme.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "topik_exams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopikExam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Level level; // TOPIK_I, TOPIK_II

    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "total_score", nullable = false)
    private BigDecimal totalScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status; // OPEN, DRAFT

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Level {
        TOPIK_I, TOPIK_II
    }

    public enum Status {
        OPEN, DRAFT
    }
}