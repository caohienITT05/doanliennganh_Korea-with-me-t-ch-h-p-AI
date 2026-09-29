package com.koreanwithme.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "topik_submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopikSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id")
    private TopikExam exam;

    @Column(name = "listening_score", precision = 5, scale = 2)
    private BigDecimal listeningScore;

    @Column(name = "reading_score", precision = 5, scale = 2)
    private BigDecimal readingScore;

    @Column(name = "writing_score", precision = 5, scale = 2)
    private BigDecimal writingScore;

    @Column(name = "total_score", precision = 5, scale = 2)
    private BigDecimal totalScore;

    @Column(name = "passed_level")
    private String passedLevel;

    @Lob
    @Column(name = "submitted_answers", columnDefinition = "LONGTEXT")
    private String submittedAnswers;

    @Lob
    @Column(name = "writing_feedback", columnDefinition = "LONGTEXT")
    private String writingFeedback;

    // THÊM TRƯỜNG NÀY ĐỂ LƯU THỜI GIAN NỘP BÀI
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Tự động gán thời gian hiện tại trước khi lưu vào database
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}