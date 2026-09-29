package com.koreanwithme.backend.service;

import com.koreanwithme.backend.dto.TopikDtos.*;
import com.koreanwithme.backend.entity.TopikExam;
import com.koreanwithme.backend.entity.TopikQuestion;
import com.koreanwithme.backend.repository.TopikExamRepository;
import com.koreanwithme.backend.repository.TopikQuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminTopikService {

    @Autowired
    private TopikExamRepository examRepository;

    @Autowired
    private TopikQuestionRepository questionRepository;

    // 1. Tạo đề thi mới
    @Transactional
    public ExamResponse createExam(ExamRequest req) {
        TopikExam exam = TopikExam.builder()
                .title(req.getTitle())
                .level(req.getLevel())
                .durationMinutes(req.getDurationMinutes())
                .totalScore(req.getTotalScore())
                .status(req.getStatus() != null ? req.getStatus() : TopikExam.Status.DRAFT)
                .build();

        TopikExam saved = examRepository.save(exam);
        return toExamResponse(saved, 0);
    }

    // 2. Lấy danh sách đề thi
    public List<ExamResponse> getAllExams() {
        return examRepository.findAll().stream()
                .map(e -> {
                    int questionCount = questionRepository.findByExamIdOrderByQuestionNumAsc(e.getId()).size();
                    return toExamResponse(e, questionCount);
                })
                .collect(Collectors.toList());
    }

    // 3. Chi tiết đề thi và toàn bộ câu hỏi
    public ExamDetailResponse getExamDetail(Integer examId) {
        TopikExam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đề thi ID: " + examId));

        List<QuestionDto> questions = questionRepository.findByExamIdOrderByQuestionNumAsc(examId)
                .stream().map(this::toQuestionDto).collect(Collectors.toList());

        return ExamDetailResponse.builder()
                .exam(toExamResponse(exam, questions.size()))
                .questions(questions)
                .build();
    }

    // 4. Lưu ngân hàng câu hỏi vào Database
    @Transactional
    public List<QuestionDto> saveQuestions(Integer examId, List<QuestionDto> questionDtos) {
        TopikExam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đề thi ID: " + examId));

        // Xóa các câu hỏi cũ nếu cập nhật lại toàn bộ
        questionRepository.deleteByExamId(examId);

        List<TopikQuestion> entities = questionDtos.stream().map(dto -> TopikQuestion.builder()
                .exam(exam)
                .questionNum(dto.getQuestionNum())
                .section(dto.getSection())
                .questionType(dto.getQuestionType() != null ? dto.getQuestionType() : TopikQuestion.QuestionType.MULTIPLE_CHOICE)
                .passage(dto.getPassage())
                .questionText(dto.getQuestionText())
                .imageUrl(dto.getImageUrl())
                .audioUrl(dto.getAudioUrl())
                .option1(dto.getOption1())
                .option2(dto.getOption2())
                .option3(dto.getOption3())
                .option4(dto.getOption4())
                .correctOption(dto.getCorrectOption())
                .score(dto.getScore())
                .explanation(dto.getExplanation())
                .build()).collect(Collectors.toList());

        List<TopikQuestion> saved = questionRepository.saveAll(entities);
        return saved.stream().map(this::toQuestionDto).collect(Collectors.toList());
    }

    // 5. Cập nhật thông tin đề thi (Tên, trạng thái OPEN/DRAFT)
    @Transactional
    public ExamResponse updateExam(Integer id, ExamRequest req) {
        TopikExam exam = examRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đề thi!"));

        exam.setTitle(req.getTitle());
        exam.setLevel(req.getLevel());
        exam.setDurationMinutes(req.getDurationMinutes());
        exam.setTotalScore(req.getTotalScore());
        exam.setStatus(req.getStatus());

        int count = questionRepository.findByExamIdOrderByQuestionNumAsc(id).size();
        return toExamResponse(examRepository.save(exam), count);
    }

    // 6. Xóa đề thi
    @Transactional
    public void deleteExam(Integer id) {
        examRepository.deleteById(id);
    }

    private ExamResponse toExamResponse(TopikExam e, int qCount) {
        return ExamResponse.builder()
                .id(e.getId())
                .title(e.getTitle())
                .level(e.getLevel())
                .durationMinutes(e.getDurationMinutes())
                .totalScore(e.getTotalScore())
                .status(e.getStatus())
                .createdAt(e.getCreatedAt())
                .totalQuestions(qCount)
                .build();
    }

    private QuestionDto toQuestionDto(TopikQuestion q) {
        return QuestionDto.builder()
                .id(q.getId())
                .questionNum(q.getQuestionNum())
                .section(q.getSection())
                .questionType(q.getQuestionType())
                .passage(q.getPassage())
                .questionText(q.getQuestionText())
                .imageUrl(q.getImageUrl())
                .audioUrl(q.getAudioUrl())
                .option1(q.getOption1())
                .option2(q.getOption2())
                .option3(q.getOption3())
                .option4(q.getOption4())
                .correctOption(q.getCorrectOption())
                .score(q.getScore())
                .explanation(q.getExplanation())
                .build();
    }
}