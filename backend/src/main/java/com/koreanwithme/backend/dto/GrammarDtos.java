package com.koreanwithme.backend.dto;

import lombok.*;

import java.math.BigDecimal;

public class GrammarDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TranslationEvaluateRequest {
        private String grammarName;
        private String direction; // "KOR_TO_VIE" hoặc "VIE_TO_KOR"
        private String originalSentence;
        private String studentTranslation;
        private String referenceAnswer;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TranslationEvaluateResponse {
        private BigDecimal score; // Thang điểm 10.0
        private boolean isAccurate;
        private String feedback; // Nhận xét từ Gemini AI
        private String suggestedAnswer; // Câu dịch chuẩn nhất đề xuất
    }
}