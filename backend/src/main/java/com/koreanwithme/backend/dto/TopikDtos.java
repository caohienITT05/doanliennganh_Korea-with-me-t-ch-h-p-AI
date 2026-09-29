package com.koreanwithme.backend.dto;

import com.koreanwithme.backend.entity.TopikExam;
import com.koreanwithme.backend.entity.TopikQuestion;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class TopikDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExamRequest {
        private String title;
        private TopikExam.Level level;
        private Integer durationMinutes;
        private BigDecimal totalScore;
        private TopikExam.Status status;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExamResponse {
        private Integer id;
        private String title;
        private TopikExam.Level level;
        private Integer durationMinutes;
        private BigDecimal totalScore;
        private TopikExam.Status status;
        private LocalDateTime createdAt;
        private Integer totalQuestions;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionDto {
        private Integer id;
        private Integer questionNum;
        private TopikQuestion.Section section;
        private TopikQuestion.QuestionType questionType;
        private String passage;
        private String questionText;
        private String imageUrl;
        private String audioUrl;
        private String option1;
        private String option2;
        private String option3;
        private String option4;
        private String correctOption;
        private BigDecimal score;
        private String explanation;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AudioMappingResponse {
        private String originalFileName;
        private String audioUrl;
        private List<Integer> mappedQuestionNums;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ExamDetailResponse {
        private ExamResponse exam;
        private List<QuestionDto> questions;
    }

    // Dữ liệu học viên gửi lên khi bấm "Nộp bài"
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubmissionRequest {
        private Integer examId;
        private Map<Integer, String> answers;
    }

    // Kết quả trả về sau khi hệ thống & Gemini chấm xong
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubmissionResponse {
        private Integer submissionId;
        private BigDecimal listeningScore;
        private BigDecimal readingScore;
        private BigDecimal writingScore;
        private BigDecimal totalScore;
        private String passedLevel;
        private String writingFeedback;
        private List<QuestionResultDto> detailedResults;
    }

    // DTO thông tin từng câu hỏi trả về màn hình review
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionResultDto {
        private Integer questionId;
        private Integer questionNum;
        private TopikQuestion.Section section;
        private TopikQuestion.QuestionType questionType;
        private String passage;
        private String questionText;
        private String option1;
        private String option2;
        private String option3;
        private String option4;
        private String studentAnswer;
        private String correctAnswer;
        private boolean isCorrect;
        private BigDecimal score;
        private String explanation;
    }

    // DTO gửi yêu cầu AI giải thích câu hỏi
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExplainRequest {
        private Integer questionId;
        private String studentAnswer;
    }
    // DTO hiển thị danh sách lịch sử thi
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SubmissionHistoryDto {
        private Integer submissionId;
        private Integer examId;
        private String examTitle;
        private TopikExam.Level examLevel;
        private BigDecimal listeningScore;
        private BigDecimal readingScore;
        private BigDecimal writingScore;
        private BigDecimal totalScore;
        private String passedLevel;
        private LocalDateTime submittedAt;
    }
    // DTO cho Admin xem danh sách kết quả bài thi của học viên
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminSubmissionDto {
        private Integer submissionId;
        private Integer userId;
        private String userFullName;
        private String userEmail;
        private Integer examId;
        private String examTitle;
        private TopikExam.Level examLevel;
        private BigDecimal listeningScore;
        private BigDecimal readingScore;
        private BigDecimal writingScore;
        private BigDecimal totalScore;
        private String passedLevel;
        private LocalDateTime submittedAt;
    }

    // DTO cho Admin xem chi tiết 1 bài thi của học viên
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdminSubmissionDetailDto {
        private Integer submissionId;
        private Integer userId;
        private String userFullName;
        private String userEmail;
        private Integer examId;
        private String examTitle;
        private TopikExam.Level examLevel;
        private BigDecimal listeningScore;
        private BigDecimal readingScore;
        private BigDecimal writingScore;
        private BigDecimal totalScore;
        private String passedLevel;
        private String writingFeedback;
        private LocalDateTime submittedAt;
        private List<QuestionResultDto> questions;
    }
}