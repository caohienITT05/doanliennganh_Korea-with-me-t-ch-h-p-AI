package com.koreanwithme.backend.dto;

import lombok.*;

import java.util.List;

public class ChatDtos {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatMessage {
        private String role; // "user" hoặc "model"
        private String content;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatRequest {
        private String message;
        private List<ChatMessage> history; // Gửi lịch sử chat để AI nhớ ngữ cảnh cuộc trò chuyện
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatResponse {
        private String reply;
    }
}