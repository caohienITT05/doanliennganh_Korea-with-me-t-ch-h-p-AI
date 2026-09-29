package com.koreanwithme.backend.dto;

import lombok.*;
import java.math.BigDecimal;

public class CourseDtos {

    // Request dùng chung cho Thêm mới & Cập nhật khóa học
    @Data
    public static class CourseRequest {
        private String name;
        private String description;
        private String thumbnailUrl;
        private BigDecimal price;
        private Boolean isFree;
        private String status; // "OPEN" hoặc "CLOSED"
    }

    // Tương thích ngược với tên cũ nếu có nơi nào gọi
    public static class CourseUpdateRequest extends CourseRequest {}

    @Data
    public static class LessonRequest {
        private Integer courseId;
        private String title;
        private Integer orderIndex;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class LessonResponse {
        private Integer id;
        private Integer courseId;
        private String title;
        private Integer orderIndex;
    }

    @Data
    public static class VocabularyRequest {
        private Integer lessonId;
        private String wordKr;
        private String meaningVn;
        private String audioUrl;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class VocabularyResponse {
        private Integer id;
        private Integer lessonId;
        private String wordKr;
        private String meaningVn;
        private String audioUrl;
    }

    @Data
    public static class GrammarRequest {
        private Integer lessonId;
        private String structure;
        private String usageDesc;
        private String exampleKr;
        private String exampleVn;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class GrammarResponse {
        private Integer id;
        private Integer lessonId;
        private String structure;
        private String usageDesc;
        private String exampleKr;
        private String exampleVn;
    }
}