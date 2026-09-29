package com.koreanwithme.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "topik_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TopikQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private TopikExam exam;

    @Column(name = "question_num", nullable = false)
    private Integer questionNum;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Section section; // LISTENING, READING, WRITING

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType questionType; // MULTIPLE_CHOICE, SHORT_WRITING, ESSAY

    @Column(columnDefinition = "TEXT")
    private String passage;

    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false)
    private String questionText;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "audio_url", columnDefinition = "TEXT")
    private String audioUrl;

    @Column(name = "option_1", columnDefinition = "TEXT")
    private String option1;

    @Column(name = "option_2", columnDefinition = "TEXT")
    private String option2;

    @Column(name = "option_3", columnDefinition = "TEXT")
    private String option3;

    @Column(name = "option_4", columnDefinition = "TEXT")
    private String option4;

    @Column(name = "correct_option", length = 10)
    private String correctOption; // "1", "2", "3", "4" hoặc từ khóa cho C51-52

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal score;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Section {
        LISTENING, READING, WRITING
    }

    public enum QuestionType {
        MULTIPLE_CHOICE, SHORT_WRITING, ESSAY
    }
}