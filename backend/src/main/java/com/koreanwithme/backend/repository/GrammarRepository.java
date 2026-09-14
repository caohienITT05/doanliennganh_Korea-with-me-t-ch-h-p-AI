package com.koreanwithme.backend.repository;

import com.koreanwithme.backend.entity.Grammar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrammarRepository extends JpaRepository<Grammar, Integer> {
    List<Grammar> findByLessonIdOrderByIdAsc(Integer lessonId);
}