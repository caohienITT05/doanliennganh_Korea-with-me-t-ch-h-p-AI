package com.koreanwithme.backend.controller;

import com.koreanwithme.backend.dto.ChatDtos.*;
import com.koreanwithme.backend.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private GeminiService geminiService;

    @PostMapping("/ask")
    public ResponseEntity<ChatResponse> askAssistant(@RequestBody ChatRequest request) {
        if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ChatResponse.builder().reply("Vui lòng nhập câu hỏi!").build());
        }

        String reply = geminiService.chatWithAssistant(request.getMessage(), request.getHistory());
        return ResponseEntity.ok(ChatResponse.builder().reply(reply).build());
    }
}