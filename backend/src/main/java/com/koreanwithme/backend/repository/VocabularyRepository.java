package com.koreanwithme.backend.repository;

import com.koreanwithme.backend.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary, Integer> {
    List<Vocabulary> findByLessonIdOrderByIdAsc(Integer lessonId);
}