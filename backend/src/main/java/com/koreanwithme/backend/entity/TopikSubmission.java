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
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private TopikExam exam;

    @Column(name = "listening_score", precision = 5, scale = 1)
    private BigDecimal listeningScore;

    @Column(name = "reading_score", precision = 5, scale = 1)
    private BigDecimal readingScore;

    @Column(name = "writing_score", precision = 5, scale = 1)
    private BigDecimal writingScore;

    @Column(name = "total_score", precision = 5, scale = 1)
    private BigDecimal totalScore;

    @Column(name = "passed_level", length = 50)
    private String passedLevel;

    @Column(name = "submitted_answers", columnDefinition = "LONGTEXT")
    private String submittedAnswers; // Chuỗi JSON lưu toàn bộ đáp án trắc nghiệm & text bài viết

    @Column(name = "writing_feedback", columnDefinition = "LONGTEXT")
    private String writingFeedback; // Chuỗi JSON chứa điểm và nhận xét chi tiết của Gemini cho C51-C54

    @Column(name = "completed_at", insertable = false, updatable = false)
    private LocalDateTime completedAt;
}