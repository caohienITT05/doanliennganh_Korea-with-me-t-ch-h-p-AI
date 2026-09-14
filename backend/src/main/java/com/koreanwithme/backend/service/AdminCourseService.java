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

    // ================= 1. KHÓA HỌC (COURSES) =================
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @Transactional
    public Course updateCourse(Integer id, CourseUpdateRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học!"));

        if (request.getName() != null) course.setName(request.getName());
        if (request.getDescription() != null) course.setDescription(request.getDescription());
        if (request.getPrice() != null) course.setPrice(request.getPrice());
        if (request.getIsFree() != null) course.setIsFree(request.getIsFree());
        if (request.getStatus() != null) {
            course.setStatus(Course.Status.valueOf(request.getStatus().toUpperCase()));
        }

        return courseRepository.save(course);
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
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học!"));

        Lesson lesson = Lesson.builder()
                .course(course)
                .title(req.getTitle())
                .orderIndex(req.getOrderIndex() != null ? req.getOrderIndex() : 0)
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
    public void deleteLesson(Integer id) {
        lessonRepository.deleteById(id);
    }

    // ================= 3. TỪ VỰNG (VOCABULARIES) =================
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
                .wordKr(req.getWordKr())
                .meaningVn(req.getMeaningVn())
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
    public void deleteVocabulary(Integer id) {
        vocabularyRepository.deleteById(id);
    }

    // ================= 4. NGỮ PHÁP (GRAMMARS) =================
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
                .structure(req.getStructure())
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
    public void deleteGrammar(Integer id) {
        grammarRepository.deleteById(id);
    }
    @Transactional
    public List<VocabularyResponse> createVocabulariesBatch(List<VocabularyRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return Collections.emptyList();
        }

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
    public List<GrammarResponse> createGrammarsBatch(List<GrammarRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return Collections.emptyList();
        }

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
}