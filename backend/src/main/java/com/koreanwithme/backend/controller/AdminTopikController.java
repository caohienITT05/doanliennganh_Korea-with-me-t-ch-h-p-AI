package com.koreanwithme.backend.controller;

import com.koreanwithme.backend.dto.TopikDtos.*;
import com.koreanwithme.backend.service.AdminTopikService;
import com.koreanwithme.backend.service.FileStorageService;
import com.koreanwithme.backend.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpHeaders;
import com.koreanwithme.backend.service.TopikSubmissionService;
import org.springframework.http.MediaType;
import java.util.*;

@RestController
@RequestMapping("/api/admin/topik")
@CrossOrigin(origins = "*")
public class AdminTopikController {

    @Autowired
    private AdminTopikService adminTopikService;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private FileStorageService fileStorageService;

    // 1. Lấy danh sách đề thi
    @GetMapping("/exams")
    public ResponseEntity<List<ExamResponse>> getExams() {
        return ResponseEntity.ok(adminTopikService.getAllExams());
    }

    // 2. Tạo thông tin cơ bản cho đề thi
    @PostMapping("/exams")
    public ResponseEntity<ExamResponse> createExam(@RequestBody ExamRequest request) {
        return ResponseEntity.ok(adminTopikService.createExam(request));
    }

    // 3. Lấy chi tiết đề thi kèm toàn bộ câu hỏi
    @GetMapping("/exams/{id}")
    public ResponseEntity<ExamDetailResponse> getExamDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(adminTopikService.getExamDetail(id));
    }

    // 4. Cập nhật thông tin đề thi
    @PutMapping("/exams/{id}")
    public ResponseEntity<ExamResponse> updateExam(@PathVariable Integer id, @RequestBody ExamRequest request) {
        return ResponseEntity.ok(adminTopikService.updateExam(id, request));
    }

    // 5. Xóa đề thi
    @DeleteMapping("/exams/{id}")
    public ResponseEntity<?> deleteExam(@PathVariable Integer id) {
        adminTopikService.deleteExam(id);
        return ResponseEntity.ok(Collections.singletonMap("message", "Đã xóa đề thi thành công!"));
    }

    // 6. Tải PDF và nhờ Gemini trích xuất ra mảng câu hỏi để Preview
    // 6. Tải PDF và nhờ Gemini trích xuất (hỗ trợ lọc theo phần: ALL, LISTENING, READING)
    @PostMapping("/exams/extract-pdf")
    public ResponseEntity<?> extractPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "level", defaultValue = "TOPIK_I") String level,
            @RequestParam(value = "section", defaultValue = "ALL") String section) {
        try {
            List<QuestionDto> questions = geminiService.extractQuestionsFromPdf(file, level, section);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    // 7. Tải nhiều file Audio MP3 cùng lúc, lưu vào server và trả về danh sách mapping
    @PostMapping("/exams/{id}/upload-audios")
    public ResponseEntity<?> uploadAudios(
            @PathVariable Integer id,
            @RequestParam("files") List<MultipartFile> files) {
        try {
            List<AudioMappingResponse> mappings = fileStorageService.storeExamAudios(id, files);
            return ResponseEntity.ok(mappings);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    // 8. Lưu danh sách câu hỏi hoàn chỉnh (đã gắn Audio và kiểm duyệt) vào MySQL
    @PostMapping("/exams/{id}/questions")
    public ResponseEntity<?> saveQuestions(
            @PathVariable Integer id,
            @RequestBody List<QuestionDto> questions) {
        try {
            List<QuestionDto> saved = adminTopikService.saveQuestions(id, questions);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }
    @Autowired
    private com.koreanwithme.backend.service.ExcelService excelService;

    // 10. Tải danh sách câu hỏi lên từ file Excel (.xlsx, .xls)
    @PostMapping("/exams/import-excel")
    public ResponseEntity<?> importFromExcel(@RequestParam("file") MultipartFile file) {
        try {
            List<QuestionDto> questions = excelService.parseQuestionsFromExcel(file);
            return ResponseEntity.ok(questions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", e.getMessage()));
        }
    }

    // 11. Tải file Excel mẫu (.xlsx) theo cấp độ TOPIK I hoặc TOPIK II
    @GetMapping("/exams/download-excel-template")
    public ResponseEntity<byte[]> downloadExcelTemplate(
            @RequestParam(value = "level", defaultValue = "TOPIK_I") String level) {
        byte[] excelBytes = excelService.generateQuestionTemplate(level);
        String fileName = "topik_" + level.toLowerCase() + "_template.xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }
    @Autowired
    private TopikSubmissionService submissionService;

    // 12. Admin lấy danh sách toàn bộ bài thi đã nộp của các học viên
    @GetMapping("/submissions")
    public ResponseEntity<List<AdminSubmissionDto>> getAllSubmissions() {
        return ResponseEntity.ok(submissionService.getAllSubmissionsForAdmin());
    }

    // 13. Admin xem chi tiết 1 bài nộp của học viên (gồm câu hỏi, đáp án và nhận xét AI)
    @GetMapping("/submissions/{id}")
    public ResponseEntity<AdminSubmissionDetailDto> getSubmissionDetail(@PathVariable Integer id) {
        return ResponseEntity.ok(submissionService.getSubmissionDetailForAdmin(id));
    }
}