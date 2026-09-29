package com.koreanwithme.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.koreanwithme.backend.dto.TopikDtos.*;
import com.koreanwithme.backend.entity.*;
import com.koreanwithme.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class TopikSubmissionService {

    @Autowired
    private TopikExamRepository examRepository;

    @Autowired
    private TopikQuestionRepository questionRepository;

    @Autowired
    private TopikSubmissionRepository submissionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GeminiService geminiService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public SubmissionResponse submitExam(Integer userId, SubmissionRequest request) {
        TopikExam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đề thi!"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin tài khoản!"));

        List<TopikQuestion> questions = questionRepository.findByExamIdOrderByQuestionNumAsc(exam.getId());

        BigDecimal listeningScore = BigDecimal.ZERO;
        BigDecimal readingScore = BigDecimal.ZERO;
        BigDecimal writingScore = BigDecimal.ZERO;

        List<QuestionResultDto> detailedList = new ArrayList<>();
        Map<String, String> writingAnswers = new HashMap<>();

        // 1. Chấm điểm từng câu và đóng gói thông tin xem lại
        for (TopikQuestion q : questions) {
            String studentAns = request.getAnswers() != null ? request.getAnswers().get(q.getId()) : null;

            if (q.getSection() == TopikQuestion.Section.LISTENING || q.getSection() == TopikQuestion.Section.READING) {
                boolean isCorrect = q.getCorrectOption() != null && q.getCorrectOption().trim().equalsIgnoreCase(studentAns != null ? studentAns.trim() : "");
                BigDecimal earnedScore = isCorrect ? q.getScore() : BigDecimal.ZERO;

                if (isCorrect) {
                    if (q.getSection() == TopikQuestion.Section.LISTENING) {
                        listeningScore = listeningScore.add(q.getScore());
                    } else {
                        readingScore = readingScore.add(q.getScore());
                    }
                }

                detailedList.add(QuestionResultDto.builder()
                        .questionId(q.getId())
                        .questionNum(q.getQuestionNum())
                        .section(q.getSection())
                        .questionType(q.getQuestionType())
                        .passage(q.getPassage())
                        .questionText(q.getQuestionText())
                        .option1(q.getOption1())
                        .option2(q.getOption2())
                        .option3(q.getOption3())
                        .option4(q.getOption4())
                        .studentAnswer(studentAns)
                        .correctAnswer(q.getCorrectOption())
                        .isCorrect(isCorrect)
                        .score(earnedScore)
                        .explanation(q.getExplanation())
                        .build());

            } else if (q.getSection() == TopikQuestion.Section.WRITING) {
                String promptInfo = "Đề bài: " + q.getQuestionText() +
                        (q.getPassage() != null ? "\nNgữ cảnh: " + q.getPassage() : "") +
                        "\nBài mẫu chuẩn: " + q.getCorrectOption() +
                        "\nBài làm học viên: " + (studentAns != null ? studentAns : "Chưa làm");
                writingAnswers.put(String.valueOf(q.getQuestionNum()), promptInfo);
            }
        }

        // 2. Chấm phần Viết bằng Gemini (nếu là TOPIK II có câu viết)
        String writingFeedbackJson = "{}";
        if (!writingAnswers.isEmpty()) {
            writingFeedbackJson = geminiService.gradeWritingSection(exam.getTitle(), writingAnswers);
            try {
                JsonNode wRoot = objectMapper.readTree(writingFeedbackJson);
                if (wRoot.has("totalWritingScore")) {
                    writingScore = new BigDecimal(wRoot.get("totalWritingScore").asText("0.0"));
                }
            } catch (Exception ignored) {}
        }

        BigDecimal totalScore = listeningScore.add(readingScore).add(writingScore);
        String passedLevel = calculateTopikLevel(exam.getLevel(), totalScore);

        // 3. Lưu vào Database
        TopikSubmission submission = TopikSubmission.builder()
                .user(user)
                .exam(exam)
                .listeningScore(listeningScore)
                .readingScore(readingScore)
                .writingScore(writingScore)
                .totalScore(totalScore)
                .passedLevel(passedLevel)
                .submittedAnswers(objectMapper.valueToTree(request.getAnswers()).toString())
                .writingFeedback(writingFeedbackJson)
                .build();

        TopikSubmission saved = submissionRepository.save(submission);

        return SubmissionResponse.builder()
                .submissionId(saved.getId())
                .listeningScore(listeningScore)
                .readingScore(readingScore)
                .writingScore(writingScore)
                .totalScore(totalScore)
                .passedLevel(passedLevel)
                .writingFeedback(writingFeedbackJson)
                .detailedResults(detailedList)
                .build();
    }

    private String calculateTopikLevel(TopikExam.Level level, BigDecimal score) {
        double s = score.doubleValue();
        if (level == TopikExam.Level.TOPIK_I) {
            if (s >= 140.0) return "TOPIK Level 2";
            if (s >= 80.0) return "TOPIK Level 1";
            return "Chưa đạt (Không đỗ cấp nào)";
        } else {
            if (s >= 230.0) return "TOPIK Level 6";
            if (s >= 190.0) return "TOPIK Level 5";
            if (s >= 150.0) return "TOPIK Level 4";
            if (s >= 120.0) return "TOPIK Level 3";
            return "Chưa đạt (Không đỗ cấp nào)";
        }
    }
}