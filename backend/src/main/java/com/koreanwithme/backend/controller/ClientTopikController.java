package com.koreanwithme.backend.controller;

import com.koreanwithme.backend.dto.TopikDtos.*;
import com.koreanwithme.backend.entity.TopikExam;
import com.koreanwithme.backend.entity.TopikQuestion;
import com.koreanwithme.backend.entity.User;
import com.koreanwithme.backend.repository.TopikQuestionRepository;
import com.koreanwithme.backend.repository.UserRepository;
import com.koreanwithme.backend.service.AdminTopikService;
import com.koreanwithme.backend.service.GeminiService;
import com.koreanwithme.backend.service.TopikSubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/exams")
@CrossOrigin(origins = "*")
public class ClientTopikController {

    @Autowired
    private AdminTopikService adminTopikService;

    @Autowired
    private TopikSubmissionService submissionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TopikQuestionRepository questionRepository;

    @Autowired
    private GeminiService geminiService; // Đã bổ sung inject GeminiService

    // 1. Học viên lấy danh sách đề thi đang mở (status = OPEN)
    @GetMapping
    public ResponseEntity<List<ExamResponse>> getAvailableExams() {
        List<ExamResponse> exams = adminTopikService.getAllExams().stream()
                .filter(e -> e.getStatus() == TopikExam.Status.OPEN)
                .collect(Collectors.toList());
        return ResponseEntity.ok(exams);
    }

    // 2. Học viên lấy chi tiết đề để bắt đầu thi (ẩn đáp án đúng và lời giải)
    @GetMapping("/{id}/take")
    public ResponseEntity<ExamDetailResponse> getExamForTaking(@PathVariable Integer id) {
        ExamDetailResponse detail = adminTopikService.getExamDetail(id);
        detail.getQuestions().forEach(q -> {
            q.setCorrectOption(null);
            q.setExplanation(null);
        });
        return ResponseEntity.ok(detail);
    }

    // 3. Học viên nộp bài thi
    @PostMapping("/submit")
    public ResponseEntity<?> submitExam(
            @RequestBody SubmissionRequest request,
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("error", "Vui lòng đăng nhập tài khoản trước khi nộp bài thi!"));
        }

        User user = null;
        Object principal = authentication.getPrincipal();

        // TRƯỜNG HỢP 1: Principal chính là đối tượng User
        if (principal instanceof User) {
            user = (User) principal;
        }
        // TRƯỜNG HỢP 2: Principal là UserDetails mặc định của Spring Security
        else if (principal instanceof UserDetails) {
            String email = ((UserDetails) principal).getUsername();
            user = userRepository.findByEmail(email).orElse(null);
        }
        // TRƯỜNG HỢP 3: Principal là chuỗi Email hoặc ID
        else {
            String principalStr = principal.toString().trim();
            user = userRepository.findByEmail(principalStr).orElse(null);
            if (user == null) {
                try {
                    Integer id = Integer.parseInt(principalStr);
                    user = userRepository.findById(id).orElse(null);
                } catch (NumberFormatException ignored) {}
            }
        }

        if (user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("error", "Không thể xác định thông tin tài khoản hợp lệ!"));
        }

        System.out.println(">>> [Nộp bài thành công] Đang chấm điểm cho học viên ID: " + user.getId() + " (" + user.getEmail() + ")");
        SubmissionResponse response = submissionService.submitExam(user.getId(), request);
        return ResponseEntity.ok(response);
    }

    // 4. Học viên yêu cầu AI giải thích chi tiết 1 câu hỏi
    @PostMapping("/explain-question")
    public ResponseEntity<?> explainQuestion(@RequestBody ExplainRequest request) {
        TopikQuestion question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy câu hỏi ID: " + request.getQuestionId()));

        String aiExplanation = geminiService.explainSingleQuestion(question, request.getStudentAnswer());
        return ResponseEntity.ok(Collections.singletonMap("explanation", aiExplanation));
    }
    // 5. Lấy danh sách lịch sử thi của học viên đang đăng nhập
    @GetMapping("/my-history")
    public ResponseEntity<?> getMyExamHistory(Authentication authentication) {
        User user = resolveUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vui lòng đăng nhập!");
        }
        return ResponseEntity.ok(submissionService.getMyExamHistory(user.getId()));
    }

    // 6. Xem lại chi tiết 1 bài thi cũ kèm câu hỏi và lời phê AI
    @GetMapping("/my-history/{submissionId}")
    public ResponseEntity<?> getSubmissionDetail(
            @PathVariable Integer submissionId,
            Authentication authentication) {
        User user = resolveUser(authentication);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Vui lòng đăng nhập!");
        }
        return ResponseEntity.ok(submissionService.getSubmissionDetail(user.getId(), submissionId));
    }

    // Hàm phụ trợ nhận diện User an toàn
    private User resolveUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof User) return (User) principal;
        if (principal instanceof UserDetails) {
            return userRepository.findByEmail(((UserDetails) principal).getUsername()).orElse(null);
        }
        return userRepository.findByEmail(principal.toString().trim()).orElse(null);
    }
}