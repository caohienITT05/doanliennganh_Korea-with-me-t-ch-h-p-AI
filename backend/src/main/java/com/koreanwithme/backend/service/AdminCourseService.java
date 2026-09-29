package com.koreanwithme.backend.service;

import com.koreanwithme.backend.dto.CourseDtos.*;
import com.koreanwithme.backend.entity.*;
import com.koreanwithme.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminCourseService {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Autowired
    private GrammarRepository grammarRepository;

    // ================= 1. KHÓA HỌC =================
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @Transactional
    public Course createCourse(CourseRequest req) {
        Course course = Course.builder()
                .name(req.getName())
                .description(req.getDescription())
                .thumbnailUrl(req.getThumbnailUrl())
                .price(req.getIsFree() != null && req.getIsFree() ? java.math.BigDecimal.ZERO : (req.getPrice() != null ? req.getPrice() : java.math.BigDecimal.ZERO))
                .isFree(req.getIsFree() != null ? req.getIsFree() : false)
                .status(req.getStatus() != null ? Course.Status.valueOf(req.getStatus().toUpperCase()) : Course.Status.OPEN)
                .build();
        return courseRepository.save(course);
    }

    @Transactional
    public Course updateCourse(Integer id, CourseRequest req) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học!"));

        if (req.getName() != null) course.setName(req.getName());
        if (req.getDescription() != null) course.setDescription(req.getDescription());
        if (req.getThumbnailUrl() != null) course.setThumbnailUrl(req.getThumbnailUrl());
        if (req.getIsFree() != null) {
            course.setIsFree(req.getIsFree());
            if (req.getIsFree()) {
                course.setPrice(java.math.BigDecimal.ZERO);
            } else if (req.getPrice() != null) {
                course.setPrice(req.getPrice());
            }
        } else if (req.getPrice() != null) {
            course.setPrice(req.getPrice());
        }
        if (req.getStatus() != null) {
            course.setStatus(Course.Status.valueOf(req.getStatus().toUpperCase()));
        }

        return courseRepository.save(course);
    }

    @Transactional
    public void deleteCourse(Integer id) {
        courseRepository.deleteById(id);
    }

    // ================= 2. BÀI HỌC (LESSONS) =================
    public List<LessonResponse> getLessonsByCourse(Integer courseId) {
        return lessonRepository.findByCourseIdOrderByOrderIndexAsc(courseId)
                .stream()
                .map(l -> LessonResponse.builder()
                        .id(l.getId())
                        .courseId(l.getCourse().getId())
                        .title(l.getTitle())
                        .orderIndex(l.getOrderIndex())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public LessonResponse createLesson(LessonRequest req) {
        Course course = courseRepository.findById(req.getCourseId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học có ID: " + req.getCourseId()));

        Lesson lesson = Lesson.builder()
                .course(course)
                .title(req.getTitle())
                .orderIndex(req.getOrderIndex() != null ? req.getOrderIndex() : 1)
                .build();

        lessonRepository.save(lesson);

        return LessonResponse.builder()
                .id(lesson.getId())
                .courseId(course.getId())
                .title(lesson.getTitle())
                .orderIndex(lesson.getOrderIndex())
                .build();
    }

    @Transactional
    public LessonResponse updateLesson(Integer id, LessonRequest req) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài học!"));

        if (req.getTitle() != null) lesson.setTitle(req.getTitle());
        if (req.getOrderIndex() != null) lesson.setOrderIndex(req.getOrderIndex());

        lessonRepository.save(lesson);

        return LessonResponse.builder()
                .id(lesson.getId())
                .courseId(lesson.getCourse().getId())
                .title(lesson.getTitle())
                .orderIndex(lesson.getOrderIndex())
                .build();
    }

    @Transactional
    public void deleteLesson(Integer id) {
        lessonRepository.deleteById(id);
    }

    // ================= 3. TỪ VỰNG =================
    public List<VocabularyResponse> getVocabulariesByLesson(Integer lessonId) {
        return vocabularyRepository.findByLessonIdOrderByIdAsc(lessonId)
                .stream()
                .map(v -> VocabularyResponse.builder()
                        .id(v.getId())
                        .lessonId(v.getLesson().getId())
                        .wordKr(v.getWordKr())
                        .meaningVn(v.getMeaningVn())
                        .audioUrl(v.getAudioUrl())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public VocabularyResponse createVocabulary(VocabularyRequest req) {
        Lesson lesson = lessonRepository.findById(req.getLessonId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài học!"));

        Vocabulary vocab = Vocabulary.builder()
                .lesson(lesson)
                .wordKr(req.getWordKr().trim())
                .meaningVn(req.getMeaningVn().trim())
                .audioUrl(req.getAudioUrl())
                .build();

        vocabularyRepository.save(vocab);

        return VocabularyResponse.builder()
                .id(vocab.getId())
                .lessonId(lesson.getId())
                .wordKr(vocab.getWordKr())
                .meaningVn(vocab.getMeaningVn())
                .audioUrl(vocab.getAudioUrl())
                .build();
    }

    @Transactional
    public List<VocabularyResponse> createVocabulariesBatch(List<VocabularyRequest> requests) {
        if (requests == null || requests.isEmpty()) return Collections.emptyList();
        Integer lessonId = requests.get(0).getLessonId();
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài học!"));

        List<Vocabulary> list = requests.stream().map(req -> Vocabulary.builder()
                .lesson(lesson)
                .wordKr(req.getWordKr().trim())
                .meaningVn(req.getMeaningVn().trim())
                .audioUrl(req.getAudioUrl())
                .build()
        ).collect(Collectors.toList());

        List<Vocabulary> saved = vocabularyRepository.saveAll(list);
        return saved.stream().map(v -> VocabularyResponse.builder()
                .id(v.getId())
                .lessonId(lesson.getId())
                .wordKr(v.getWordKr())
                .meaningVn(v.getMeaningVn())
                .audioUrl(v.getAudioUrl())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public void deleteVocabulary(Integer id) {
        vocabularyRepository.deleteById(id);
    }

    // ================= 4. NGỮ PHÁP =================
    public List<GrammarResponse> getGrammarsByLesson(Integer lessonId) {
        return grammarRepository.findByLessonIdOrderByIdAsc(lessonId)
                .stream()
                .map(g -> GrammarResponse.builder()
                        .id(g.getId())
                        .lessonId(g.getLesson().getId())
                        .structure(g.getStructure())
                        .usageDesc(g.getUsageDesc())
                        .exampleKr(g.getExampleKr())
                        .exampleVn(g.getExampleVn())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public GrammarResponse createGrammar(GrammarRequest req) {
        Lesson lesson = lessonRepository.findById(req.getLessonId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài học!"));

        Grammar grammar = Grammar.builder()
                .lesson(lesson)
                .structure(req.getStructure().trim())
                .usageDesc(req.getUsageDesc())
                .exampleKr(req.getExampleKr())
                .exampleVn(req.getExampleVn())
                .build();

        grammarRepository.save(grammar);

        return GrammarResponse.builder()
                .id(grammar.getId())
                .lessonId(lesson.getId())
                .structure(grammar.getStructure())
                .usageDesc(grammar.getUsageDesc())
                .exampleKr(grammar.getExampleKr())
                .exampleVn(grammar.getExampleVn())
                .build();
    }

    @Transactional
    public List<GrammarResponse> createGrammarsBatch(List<GrammarRequest> requests) {
        if (requests == null || requests.isEmpty()) return Collections.emptyList();
        Integer lessonId = requests.get(0).getLessonId();
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài học!"));

        List<Grammar> list = requests.stream().map(req -> Grammar.builder()
                .lesson(lesson)
                .structure(req.getStructure().trim())
                .usageDesc(req.getUsageDesc() != null ? req.getUsageDesc().trim() : "")
                .exampleKr(req.getExampleKr() != null ? req.getExampleKr().trim() : "")
                .exampleVn(req.getExampleVn() != null ? req.getExampleVn().trim() : "")
                .build()
        ).collect(Collectors.toList());

        List<Grammar> saved = grammarRepository.saveAll(list);
        return saved.stream().map(g -> GrammarResponse.builder()
                .id(g.getId())
                .lessonId(lesson.getId())
                .structure(g.getStructure())
                .usageDesc(g.getUsageDesc())
                .exampleKr(g.getExampleKr())
                .exampleVn(g.getExampleVn())
                .build()
        ).collect(Collectors.toList());
    }

    @Transactional
    public void deleteGrammar(Integer id) {
        grammarRepository.deleteById(id);
    }
    // --- CẬP NHẬT TỪ VỰNG ---
    @Transactional
    public VocabularyResponse updateVocabulary(Integer id, VocabularyRequest req) {
        Vocabulary vocab = vocabularyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy từ vựng có ID: " + id));

        if (req.getWordKr() != null) vocab.setWordKr(req.getWordKr().trim());
        if (req.getMeaningVn() != null) vocab.setMeaningVn(req.getMeaningVn().trim());
        if (req.getAudioUrl() != null) vocab.setAudioUrl(req.getAudioUrl());

        vocabularyRepository.save(vocab);

        return VocabularyResponse.builder()
                .id(vocab.getId())
                .lessonId(vocab.getLesson().getId())
                .wordKr(vocab.getWordKr())
                .meaningVn(vocab.getMeaningVn())
                .audioUrl(vocab.getAudioUrl())
                .build();
    }

    // --- CẬP NHẬT NGỮ PHÁP ---
    @Transactional
    public GrammarResponse updateGrammar(Integer id, GrammarRequest req) {
        Grammar grammar = grammarRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ngữ pháp có ID: " + id));

        if (req.getStructure() != null) grammar.setStructure(req.getStructure().trim());
        if (req.getUsageDesc() != null) grammar.setUsageDesc(req.getUsageDesc().trim());
        if (req.getExampleKr() != null) grammar.setExampleKr(req.getExampleKr().trim());
        if (req.getExampleVn() != null) grammar.setExampleVn(req.getExampleVn().trim());

        grammarRepository.save(grammar);

        return GrammarResponse.builder()
                .id(grammar.getId())
                .lessonId(grammar.getLesson().getId())
                .structure(grammar.getStructure())
                .usageDesc(grammar.getUsageDesc())
                .exampleKr(grammar.getExampleKr())
                .exampleVn(grammar.getExampleVn())
                .build();
    }
}