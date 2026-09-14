package com.koreanwithme.backend.dto;

import lombok.*;
import java.math.BigDecimal;

public class CourseDtos {

    // 1. Cập nhật thông tin khóa học (giá, miễn phí/tính phí)
    @Data
    public static class CourseUpdateRequest {
        private String name;
        private String description;
        private BigDecimal price;
        private Boolean isFree;
        private String status; // "OPEN" hoặc "CLOSED"
    }

    // 2. Request tạo/sửa Bài học
    @Data
    public static class LessonRequest {
        private Integer courseId;
        private String title;
        private Integer orderIndex;
    }

    // 3. Response trả về Bài học
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

    // 4. Request tạo/sửa Từ vựng
    @Data
    public static class VocabularyRequest {
        private Integer lessonId;
        private String wordKr;
        private String meaningVn;
        private String audioUrl;
    }

    // 5. Response trả về Từ vựng
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

    // 6. Request tạo/sửa Ngữ pháp
    @Data
    public static class GrammarRequest {
        private Integer lessonId;
        private String structure;
        private String usageDesc;
        private String exampleKr;
        private String exampleVn;
    }

    // 7. Response trả về Ngữ pháp
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