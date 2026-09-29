package com.koreanwithme.backend.controller;

import com.koreanwithme.backend.dto.CourseDtos.*;
import com.koreanwithme.backend.entity.Course;
import com.koreanwithme.backend.service.AdminCourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminCourseController {

    @Autowired
    private AdminCourseService adminCourseService;

    // --- 1. KHÓA HỌC ---
    @GetMapping("/courses")
    public ResponseEntity<List<Course>> getAllCourses() {
        return ResponseEntity.ok(adminCourseService.getAllCourses());
    }

    @PostMapping("/courses")
    public ResponseEntity<?> createCourse(@RequestBody CourseRequest request) {
        try {
            return ResponseEntity.ok(adminCourseService.createCourse(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PutMapping("/courses/{id}")
    public ResponseEntity<?> updateCourse(@PathVariable Integer id, @RequestBody CourseRequest request) {
        try {
            return ResponseEntity.ok(adminCourseService.updateCourse(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Integer id) {
        try {
            adminCourseService.deleteCourse(id);
            return ResponseEntity.ok(Collections.singletonMap("message", "Đã xóa khóa học!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // --- 2. BÀI HỌC ---
    @GetMapping("/lessons")
    public ResponseEntity<List<LessonResponse>> getLessons(@RequestParam Integer courseId) {
        return ResponseEntity.ok(adminCourseService.getLessonsByCourse(courseId));
    }

    @PostMapping("/lessons")
    public ResponseEntity<?> createLesson(@RequestBody LessonRequest request) {
        try {
            return ResponseEntity.ok(adminCourseService.createLesson(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PutMapping("/lessons/{id}")
    public ResponseEntity<?> updateLesson(@PathVariable Integer id, @RequestBody LessonRequest request) {
        try {
            return ResponseEntity.ok(adminCourseService.updateLesson(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<?> deleteLesson(@PathVariable Integer id) {
        try {
            adminCourseService.deleteLesson(id);
            return ResponseEntity.ok(Collections.singletonMap("message", "Đã xóa bài học!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    // --- 3. TỪ VỰNG ---
    @GetMapping("/vocabularies")
    public ResponseEntity<List<VocabularyResponse>> getVocabularies(@RequestParam Integer lessonId) {
        return ResponseEntity.ok(adminCourseService.getVocabulariesByLesson(lessonId));
    }

    @PostMapping("/vocabularies")
    public ResponseEntity<?> createVocabulary(@RequestBody VocabularyRequest request) {
        try {
            return ResponseEntity.ok(adminCourseService.createVocabulary(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/vocabularies/batch")
    public ResponseEntity<?> createVocabulariesBatch(@RequestBody List<VocabularyRequest> requests) {
        try {
            return ResponseEntity.ok(adminCourseService.createVocabulariesBatch(requests));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @DeleteMapping("/vocabularies/{id}")
    public ResponseEntity<?> deleteVocabulary(@PathVariable Integer id) {
        adminCourseService.deleteVocabulary(id);
        return ResponseEntity.ok(Collections.singletonMap("message", "Đã xóa từ vựng!"));
    }

    // --- 4. NGỮ PHÁP ---
    @GetMapping("/grammars")
    public ResponseEntity<List<GrammarResponse>> getGrammars(@RequestParam Integer lessonId) {
        return ResponseEntity.ok(adminCourseService.getGrammarsByLesson(lessonId));
    }

    @PostMapping("/grammars")
    public ResponseEntity<?> createGrammar(@RequestBody GrammarRequest request) {
        try {
            return ResponseEntity.ok(adminCourseService.createGrammar(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PostMapping("/grammars/batch")
    public ResponseEntity<?> createGrammarsBatch(@RequestBody List<GrammarRequest> requests) {
        try {
            return ResponseEntity.ok(adminCourseService.createGrammarsBatch(requests));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @DeleteMapping("/grammars/{id}")
    public ResponseEntity<?> deleteGrammar(@PathVariable Integer id) {
        adminCourseService.deleteGrammar(id);
        return ResponseEntity.ok(Collections.singletonMap("message", "Đã xóa ngữ pháp!"));
    }
    @PutMapping("/vocabularies/{id}")
    public ResponseEntity<?> updateVocabulary(@PathVariable Integer id, @RequestBody VocabularyRequest request) {
        try {
            return ResponseEntity.ok(adminCourseService.updateVocabulary(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }

    @PutMapping("/grammars/{id}")
    public ResponseEntity<?> updateGrammar(@PathVariable Integer id, @RequestBody GrammarRequest request) {
        try {
            return ResponseEntity.ok(adminCourseService.updateGrammar(id, request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", e.getMessage()));
        }
    }
}