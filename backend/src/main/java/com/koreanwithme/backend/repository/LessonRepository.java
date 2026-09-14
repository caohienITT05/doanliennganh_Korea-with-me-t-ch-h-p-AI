package com.koreanwithme.backend.repository;

import com.koreanwithme.backend.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Integer> {
    List<Lesson> findByCourseIdOrderByOrderIndexAsc(Integer courseId);
}