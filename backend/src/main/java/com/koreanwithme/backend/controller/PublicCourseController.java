package com.koreanwithme.backend.controller;

import com.koreanwithme.backend.dto.CourseDtos.GrammarResponse;
import com.koreanwithme.backend.dto.CourseDtos.LessonResponse;
import com.koreanwithme.backend.dto.CourseDtos.VocabularyResponse;
import com.koreanwithme.backend.entity.Course;
import com.koreanwithme.backend.entity.Lesson;
import com.koreanwithme.backend.repository.CourseRepository;
import com.koreanwithme.backend.repository.GrammarRepository;
import com.koreanwithme.backend.repository.LessonRepository;
import com.koreanwithme.backend.repository.VocabularyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
public class PublicCourseController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private VocabularyRepository vocabularyRepository;

    @Autowired
    private GrammarRepository grammarRepository;

    // 1. Lấy danh sách khóa học đang MỞ (OPEN)
    @GetMapping("/courses")
    public ResponseEntity<List<Course>> getPublicCourses() {
        List<Course> activeCourses = courseRepository.findAll().stream()
                .filter(c -> c.getStatus() == Course.Status.OPEN)
                .collect(Collectors.toList());
        return ResponseEntity.ok(activeCourses);
    }

    // 2. Xem trước lộ trình bài học của khóa học
    @GetMapping("/courses/{id}/preview")
    public ResponseEntity<?> getCoursePreview(@PathVariable Integer id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học!"));

        List<LessonResponse> lessons = lessonRepository.findByCourseIdOrderByOrderIndexAsc(id)
                .stream()
                .map(l -> LessonResponse.builder()
                        .id(l.getId())
                        .courseId(course.getId())
                        .title(l.getTitle())
                        .orderIndex(l.getOrderIndex())
                        .build())
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("course", course);
        response.put("lessons", lessons);
        response.put("totalLessons", lessons.size());

        return ResponseEntity.ok(response);
    }

    // 3. Lấy dữ liệu Từ vựng & Ngữ pháp để vào phòng học (Flashcard / Quiz / Ngữ pháp)
    @GetMapping("/lessons/{id}/study")
    public ResponseEntity<?> getLessonStudyData(@PathVariable Integer id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài học!"));

        List<VocabularyResponse> vocabs = vocabularyRepository.findByLessonIdOrderByIdAsc(id)
                .stream()
                .map(v -> VocabularyResponse.builder()
                        .id(v.getId())
                        .lessonId(lesson.getId())
                        .wordKr(v.getWordKr())
                        .meaningVn(v.getMeaningVn())
                        .audioUrl(v.getAudioUrl())
                        .build())
                .collect(Collectors.toList());

        List<GrammarResponse> grammars = grammarRepository.findByLessonIdOrderByIdAsc(id)
                .stream()
                .map(g -> GrammarResponse.builder()
                        .id(g.getId())
                        .lessonId(lesson.getId())
                        .structure(g.getStructure())
                        .usageDesc(g.getUsageDesc())
                        .exampleKr(g.getExampleKr())
                        .exampleVn(g.getExampleVn())
                        .build())
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("lesson", LessonResponse.builder()
                .id(lesson.getId())
                .courseId(lesson.getCourse().getId())
                .title(lesson.getTitle())
                .orderIndex(lesson.getOrderIndex())
                .build());
        response.put("vocabularies", vocabs);
        response.put("grammars", grammars);

        return ResponseEntity.ok(response);
    }
}